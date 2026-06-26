import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 3000);

app.use(helmet());
app.use(cors({ origin: process.env.APP_URL ?? true }));
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
