import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { storageRoot } from "@/lib/server/storage-root";

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function keyForPath(filePath: string) {
  const relative = path.relative(storageRoot, filePath).replace(/\\/g, "/").replace(/^\.tengeguard\//, "");
  return `tengeguard:${relative.replace(/\.json$/, "")}`;
}

async function redisCommand<T>(command: string[]) {
  const config = redisConfig();
  if (!config) return null;

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Persistent store failed with ${response.status}`);
  return (await response.json()) as { result: T };
}

export function isPersistentStoreConfigured() {
  return Boolean(redisConfig());
}

export async function readStoredJson<T>(filePath: string): Promise<T | null> {
  const remote = await redisCommand<string | null>(["GET", keyForPath(filePath)]);
  if (remote) return remote.result ? (JSON.parse(remote.result) as T) : null;

  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

export async function writeStoredJson(filePath: string, data: unknown) {
  const serialized = JSON.stringify(data);
  const remote = await redisCommand<string>(["SET", keyForPath(filePath), serialized]);
  if (remote) return;

  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tempPath, filePath);
}
