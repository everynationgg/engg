// Replay logging utility for game sessions
// Stores replays with timestamps for 1-day retention

import { writeFile, mkdir, readdir, unlink } from 'fs/promises';
import path from 'path';

const REPLAY_DIR = path.resolve(process.cwd(), 'artifacts/api-server/replays');

export async function logReplay(gameId: string, replayData: any) {
  await mkdir(REPLAY_DIR, { recursive: true });
  const file = path.join(REPLAY_DIR, `${gameId}_${Date.now()}.json`);
  await writeFile(file, JSON.stringify(replayData));
}

export async function cleanupOldReplays(maxAgeMs = 24 * 60 * 60 * 1000) {
  await mkdir(REPLAY_DIR, { recursive: true });
  const files = await readdir(REPLAY_DIR);
  const now = Date.now();
  for (const file of files) {
    const match = file.match(/_(\d+)\.json$/);
    if (match) {
      const ts = Number(match[1]);
      if (now - ts > maxAgeMs) {
        await unlink(path.join(REPLAY_DIR, file));
      }
    }
  }
}
