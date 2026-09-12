import { WalkEntry } from '@std/fs';

export async function parseJSON(file: WalkEntry) {
  const _raw = await Deno.readTextFile(file.path);

  return JSON.parse(_raw);
}
