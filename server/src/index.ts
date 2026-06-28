import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { stripe } from './lib/stripe.js';
import { sendOtpEmail, sendTrialEndingEmail } from './lib/email.js';

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 3000);

const getReturnUrl = () => {
  const appUrl = process.env.APP_URL || 'http://localhost:8080';
  const isProd = process.env.NODE_ENV === 'production';
  const baseRedirectUrl = isProd && !appUrl.includes('/tiropago')
    ? `${appUrl.replace(/\/$/, '')}/tiropago`
    : appUrl;
  return `${baseRedirectUrl.replace(/\/$/, '')}/ajustes`;
};

app.use(helmet());
app.use(cors({ origin: process.env.APP_URL ?? true }));

// Webhook de Stripe (debe ir antes de express.json para recibir el body raw)
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig || '',
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await handleStripeWebhook(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error('Error processing webhook:', err.message);
    res.status(500).send('Webhook processing failed');
  }
});

app.use(express.json({ limit: '1mb' }));

const sessionSchema = z.object({
  id: z.string().optional(),
  userId: z.string().default('demo-user'),
  modalityId: z.string(),
  weaponId: z.string().optional(),
  type: z.enum(['entrenamiento', 'competicion']),
  date: z.string(),
  notes: z.string().optional()
});

const roundSchema = z.object({
  id: z.string().optional(),
  sessionId: z.string(),
  roundNumber: z.number().int().positive().optional(),
  shots: z.array(z.number().int().min(0).max(10)).length(5)
});

app.get('/health', (_request, response) => {
  response.status(200).send('ok');
});

app.get('/modalities', async (_request, response) => {
  const modalities = await prisma.modality.findMany({ orderBy: { name: 'asc' } });
  response.json(modalities);
});

app.get('/sessions', async (_request, response) => {
  const sessions = await prisma.session.findMany({
    include: { modality: true, rounds: { orderBy: { roundNumber: 'asc' } } },
    orderBy: { date: 'desc' }
  });
  response.json(sessions);
});

app.post('/sessions', async (request, response) => {
  const input = sessionSchema.parse(request.body);
  await ensureDemoUser(input.userId);

  const session = await prisma.session.create({
    data: {
      id: input.id,
      userId: input.userId,
      modalityId: input.modalityId,
      weaponId: input.weaponId,
      type: input.type,
      date: new Date(input.date),
      notes: input.notes
    }
  });

  response.status(201).json(session);
});

app.post('/rounds', async (request, response) => {
  const input = roundSchema.parse(request.body);
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: input.sessionId },
    include: { rounds: true }
  });

  const totalScore = input.shots.reduce((sum, shot) => sum + shot, 0);
  const averageScore = totalScore / input.shots.length;
  const round = await prisma.round.create({
    data: {
      id: input.id,
      sessionId: input.sessionId,
      roundNumber: input.roundNumber ?? session.rounds.length + 1,
      shot1: input.shots[0],
      shot2: input.shots[1],
      shot3: input.shots[2],
      shot4: input.shots[3],
      shot5: input.shots[4],
      totalScore,
      averageScore,
      bestShot: Math.max(...input.shots),
      worstShot: Math.min(...input.shots)
    }
  });

  const rounds = [...session.rounds, round];
  const nextTotal = rounds.reduce((sum, item) => sum + item.totalScore, 0);
  const nextShots = rounds.length * 5;

  await prisma.session.update({
    where: { id: input.sessionId },
    data: {
      totalScore: nextTotal,
      totalShots: nextShots,
      averageScore: nextTotal / nextShots
    }
  });

  response.status(201).json(round);
});

app.post('/sync', async (request, response) => {
  const items = z.array(z.object({
    type: z.enum(['session:create', 'round:create', 'session:delete']),
    payload: z.any()
  })).parse(request.body.items ?? []);

  let syncedCount = 0;

  for (const item of items) {
    if (item.type === 'session:create') {
      try {
        const sessionData = sessionSchema.parse(item.payload);
        await ensureDemoUser(sessionData.userId);

        const existing = await prisma.session.findUnique({
          where: { id: sessionData.id }
        });

        if (!existing) {
          const payloadObj = item.payload as any;
          await prisma.session.create({
            data: {
              id: sessionData.id,
              userId: sessionData.userId,
              modalityId: sessionData.modalityId,
              weaponId: sessionData.weaponId,
              type: sessionData.type,
              date: new Date(sessionData.date),
              notes: sessionData.notes,
              totalScore: typeof payloadObj.totalScore === 'number' ? payloadObj.totalScore : 0,
              totalShots: typeof payloadObj.totalShots === 'number' ? payloadObj.totalShots : 0,
              averageScore: typeof payloadObj.averageScore === 'number' ? payloadObj.averageScore : 0
            }
          });
          syncedCount++;
        }
      } catch (error) {
        console.error('Error syncing session:', error);
      }
    } else if (item.type === 'round:create') {
      try {
        const roundPayload = item.payload;
        const validatedRound = z.object({
          id: z.string(),
          sessionId: z.string(),
          roundNumber: z.number().int().positive(),
          shots: z.array(z.number().int().min(0).max(10)).length(5),
          totalScore: z.number(),
          averageScore: z.number(),
          bestShot: z.number(),
          worstShot: z.number()
        }).parse(roundPayload);

        const session = await prisma.session.findUnique({
          where: { id: validatedRound.sessionId }
        });

        if (session) {
          const existingRound = await prisma.round.findUnique({
            where: { id: validatedRound.id }
          });

          if (!existingRound) {
            await prisma.round.create({
              data: {
                id: validatedRound.id,
                sessionId: validatedRound.sessionId,
                roundNumber: validatedRound.roundNumber,
                shot1: validatedRound.shots[0],
                shot2: validatedRound.shots[1],
                shot3: validatedRound.shots[2],
                shot4: validatedRound.shots[3],
                shot5: validatedRound.shots[4],
                totalScore: validatedRound.totalScore,
                averageScore: validatedRound.averageScore,
                bestShot: validatedRound.bestShot,
                worstShot: validatedRound.worstShot
              }
            });

            const allRounds = await prisma.round.findMany({
              where: { sessionId: validatedRound.sessionId }
            });
            const nextTotal = allRounds.reduce((sum, r) => sum + r.totalScore, 0);
            const nextShots = allRounds.length * 5;

            await prisma.session.update({
              where: { id: validatedRound.sessionId },
              data: {
                totalScore: nextTotal,
                totalShots: nextShots,
                averageScore: nextShots ? nextTotal / nextShots : 0
              }
            });

            syncedCount++;
          }
        }
      } catch (error) {
        console.error('Error syncing round:', error);
      }
    } else if (item.type === 'session:delete') {
      try {
        const deleteData = z.object({ id: z.string() }).parse(item.payload);
        await prisma.session.deleteMany({
          where: { id: deleteData.id }
        });
        syncedCount++;
      } catch (error) {
        console.error('Error syncing session delete:', error);
      }
    }
  }

  response.json({ synced: syncedCount });
});

app.delete('/sessions/:id', async (request, response) => {
  try {
    const { id } = request.params;
    await prisma.session.delete({
      where: { id }
    });
    response.status(204).end();
  } catch (error) {
    console.error('Error deleting session:', error);
    response.status(500).json({ error: 'Failed to delete session' });
  }
});

app.post('/register', async (request, response) => {
  try {
    const body = z.object({
      phone: z.string().optional(),
      email: z.string().optional()
    }).parse(request.body);

    const identifier = body.email ?? body.phone;
    if (!identifier) {
      return response.status(400).json({ error: 'Phone or email is required' });
    }

    const emailVal = body.email ?? `${body.phone}@tiro22.local`;
    const nameVal = body.email ? `Tirador ${body.email.split('@')[0]}` : `Tirador ${body.phone}`;

    const user = await prisma.user.upsert({
      where: { id: identifier },
      update: {},
      create: {
        id: identifier,
        email: emailVal,
        name: nameVal
      }
    });
    response.status(200).json(user);
  } catch (error) {
    console.error('Error registering user:', error);
    response.status(500).json({ error: 'Failed to register user' });
  }
});

// --- ENDPOINTS DE AUTENTICACIÓN Y STRIPE ---

// 1. Enviar código OTP por correo
app.post('/auth/send-otp', async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    
    // Generar código de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Guardar en la base de datos
    await prisma.verificationToken.create({
      data: {
        email,
        token: otpCode,
        expiresAt
      }
    });

    // Enviar correo
    await sendOtpEmail(email, otpCode);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    res.status(400).json({ error: error.message || 'Failed to send OTP' });
  }
});

// 2. Verificar código OTP e iniciar sesión
app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, token } = z.object({
      email: z.string().email(),
      token: z.string().length(6)
    }).parse(req.body);

    // Buscar token válido y no expirado
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        email,
        token,
        expiresAt: { gt: new Date() }
      }
    });

    if (!verificationToken) {
      return res.status(401).json({ error: 'Código inválido o expirado' });
    }

    // Consumir el token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id }
    });

    // Buscar o crear usuario (el registro inicial se hace en /api/register-subscription)
    let user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true }
    });

    if (!user) {
      // Si el usuario no existe, significa que no se ha registrado con suscripción aún.
      // Le indicamos al frontend que debe proceder al registro de suscripción.
      return res.status(200).json({
        success: true,
        requiresRegistration: true,
        email
      });
    }

    res.json({
      success: true,
      requiresRegistration: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscription?.status || 'none'
      }
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    res.status(400).json({ error: error.message || 'Verification failed' });
  }
});

// 2.5 Obtener precios de los productos mensual y anual desde Stripe
app.get('/stripe-prices', async (req, res) => {
  try {
    const monthlyProductId = 'prod_UmurZxWFbU7Nux';
    const yearlyProductId = 'prod_UmuvGLlhmiYQjt';

    const [monthlyPrices, yearlyPrices] = await Promise.all([
      stripe.prices.list({ product: monthlyProductId, active: true, limit: 1 }),
      stripe.prices.list({ product: yearlyProductId, active: true, limit: 1 })
    ]);

    const monthlyPrice = monthlyPrices.data[0];
    const yearlyPrice = yearlyPrices.data[0];

    if (!monthlyPrice || !yearlyPrice) {
      return res.status(404).json({ error: 'No se encontraron precios activos en Stripe para los productos configurados.' });
    }

    res.json({
      monthly: {
        priceId: monthlyPrice.id,
        amount: (monthlyPrice.unit_amount ?? 0) / 100,
        currency: monthlyPrice.currency
      },
      yearly: {
        priceId: yearlyPrice.id,
        amount: (yearlyPrice.unit_amount ?? 0) / 100,
        currency: yearlyPrice.currency
      }
    });
  } catch (error: any) {
    console.error('Error al obtener precios de Stripe:', error);
    res.status(500).json({ error: 'Error al obtener los precios desde Stripe' });
  }
});

// 3. Registrar usuario y crear suscripción con prueba gratuita y chequeo de abuso
app.post('/register-subscription', async (req, res) => {
  try {
    const { email, name, paymentMethodId, priceId } = z.object({
      email: z.string().email(),
      name: z.string().min(2),
      paymentMethodId: z.string(),
      priceId: z.string()
    }).parse(req.body);

    // 1. Obtener detalles del método de pago de Stripe para sacar el fingerprint
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const card = paymentMethod.card;
    const fingerprint = card?.fingerprint;

    // 2. Comprobar abuso de prueba gratuita mediante card fingerprint
    if (fingerprint) {
      const duplicateCardSub = await prisma.subscription.findFirst({
        where: { cardFingerprint: fingerprint }
      });

      if (duplicateCardSub) {
        return res.status(400).json({
          error: 'TRIAL_ABUSE',
          message: 'Esta tarjeta de crédito ya ha sido utilizada para un periodo de prueba gratuito. Por favor, utiliza otra tarjeta.'
        });
      }
    }

    // 3. Crear cliente en Stripe
    const customer = await stripe.customers.create({
      email,
      name,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // 5. Crear la suscripción con 15 días de prueba
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 15,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });

    // 6. Guardar el usuario y la suscripción en la base de datos
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name }
    });

    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cardFingerprint: fingerprint || null,
        cardBrand: card?.brand || null,
        cardLast4: card?.last4 || null,
        country: card?.country || null
      }
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: subscription.status
      }
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(400).json({ error: error.message || 'Failed to create subscription' });
  }
});

// 4. Crear sesión para el Portal de Facturación de Stripe (Customer Portal)
app.post('/create-portal-session', async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true }
    });

    if (!user || !user.subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: getReturnUrl()
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// --- MANEJADOR DE WEBHOOKS DE STRIPE ---

async function handleStripeWebhook(event: any) {
  const subscriptionObj = event.data.object;
  const stripeSubscriptionId = subscriptionObj.id;

  switch (event.type) {
    case 'customer.subscription.trial_will_end': {
      // Ocurre 3 días antes de finalizar la prueba
      const sub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId },
        include: { user: true }
      });
      if (sub && sub.user.email) {
        // Crear un enlace temporal de portal de facturación para permitir la cancelación directa
        const session = await stripe.billingPortal.sessions.create({
          customer: sub.stripeCustomerId,
          return_url: getReturnUrl()
        });
        
        await sendTrialEndingEmail(
          sub.user.email,
          new Date(subscriptionObj.trial_end * 1000),
          session.url
        );
      }
      break;
    }
    case 'customer.subscription.updated': {
      // Actualizar el estado y fechas en la base de datos
      await prisma.subscription.update({
        where: { stripeSubscriptionId },
        data: {
          status: subscriptionObj.status,
          currentPeriodStart: new Date(subscriptionObj.current_period_start * 1000),
          currentPeriodEnd: new Date(subscriptionObj.current_period_end * 1000),
          trialStart: subscriptionObj.trial_start ? new Date(subscriptionObj.trial_start * 1000) : null,
          trialEnd: subscriptionObj.trial_end ? new Date(subscriptionObj.trial_end * 1000) : null,
        }
      });
      break;
    }
    case 'customer.subscription.deleted': {
      // Suscripción cancelada
      await prisma.subscription.update({
        where: { stripeSubscriptionId },
        data: {
          status: 'canceled',
        }
      });
      break;
    }
  }
}

async function ensureDemoUser(id: string) {
  await prisma.user.upsert({
    where: { id },
    update: {},
    create: {
      id,
      email: `${id}@tiro22.local`,
      name: `Tirador ${id}`
    }
  });
}

app.listen(port, () => {
  console.log(`TIRO22 API listening on ${port}`);
});
