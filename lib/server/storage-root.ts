import path from "node:path";

export const storageRoot = process.env.VERCEL ? "/tmp/tengeguard" : process.cwd();

export function storagePath(...segments: string[]) {
  return path.join(storageRoot, ".tengeguard", ...segments);
}
