import type { Round, Tirada } from '../types';

const queueKey = 'tiro22:offline-queue';

type QueueItem =
  | { type: 'session:create'; payload: Tirada; createdAt: string }
  | { type: 'round:create'; payload: Round; createdAt: string }
  | { type: 'session:delete'; payload: { id: string }; createdAt: string };

export function enqueueSync(item: Omit<QueueItem, 'createdAt'>) {
  const queue = readQueue();
  queue.push({ ...item, createdAt: new Date().toISOString() } as QueueItem);
  localStorage.setItem(queueKey, JSON.stringify(queue));
}

export function readQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(queueKey) ?? '[]') as QueueItem[];
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(queueKey);
}

export async function flushQueue(apiUrl: string) {
  const queue = readQueue();
  if (!queue.length || !navigator.onLine) return;

  const response = await fetch(`${apiUrl}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: queue })
  });

  if (response.ok) {
    clearQueue();
  }
}
