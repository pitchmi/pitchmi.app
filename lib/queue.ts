// lib/queue.ts — cola offline muy simple basada en AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@queue:v1";

export type QueueJob =
  | {
      type: "create";
      table: "pitches";
      payload: {
        title: string;
        description?: string | null;
        image_url?: string | null;
        lat: number;
        lng: number;
        category?: string | null;
      };
    };
// en el futuro: | { type: "update" | "delete", ... }

async function loadAll(): Promise<QueueJob[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as QueueJob[]) : [];
  } catch {
    return [];
  }
}

async function saveAll(items: QueueJob[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function enqueue(job: QueueJob) {
  const items = await loadAll();
  items.push(job);
  await saveAll(items);
}

export async function peek(): Promise<QueueJob | undefined> {
  const items = await loadAll();
  return items[0];
}

export async function shift(): Promise<QueueJob | undefined> {
  const items = await loadAll();
  const first = items.shift();
  await saveAll(items);
  return first;
}

export async function clearAll() {
  await AsyncStorage.removeItem(KEY);
}

export async function count(): Promise<number> {
  const items = await loadAll();
  return items.length;
}
