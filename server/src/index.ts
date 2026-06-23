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
  const items = z.array(z.object({ type: z.string(), payload: z.unknown() })).parse(request.body.items ?? []);
  response.json({ synced: items.length });
});

async function ensureDemoUser(id: string) {
  await prisma.user.upsert({
    where: { id },
    update: {},
    create: {
      id,
      email: 'demo@tiro22.local',
      name: 'Tirador demo'
    }
  });
}

app.listen(port, () => {
  console.log(`TIRO22 API listening on ${port}`);
});
