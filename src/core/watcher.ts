import { builder } from '@/core/builder.ts';
import { JsonLayerConfig } from './config.ts';

import * as path from '@dep/path';
import * as fs from '@std/fs';
import { bold, cyan, dim, green } from '@std/fmt/colors';
import { logDirNotFound, logUpdate } from '@/utils/log.ts';
import { version } from '@/utils/jsr.ts';

/**
 * Watches for JSON changes and regenerates static imports automatically.
 *
 * @param config Configuration for directories, validation, and transformations.
 * @returns Resolves if the watch process is terminated.
 * @throws Propagates filesystem watcher or builder execution errors.
 *
 * @example
 * ```ts
 * import { watcher } from '@dep/json-layer';
 * import { s } from '@dep/schema';
 *
 * await watcher({
 *   docType: 'Service',
 *   contentDir: './content/services',
 *   outDir: './dist/services',
 *   exclude: ['temp'],
 *   schemas: {
 *     ServiceWebs: s.object({ title: s.string() }),
 *   },
 * });
 * ```
 */
export async function watcher(config: JsonLayerConfig = {}) {
  if ('ok' in config) {
    if (!config.ok) return;
  }

  const contentDir = config.contentDir ?? './content';
  const outDir = config.outDir ?? '.json-layer';

  if (!fs.existsSync(contentDir)) {
    logDirNotFound(contentDir);
    return;
  }

  console.log(`\n  ${cyan(bold('JSON-LAYER'))} ${dim(`v${version}`)}`);
  console.log(
    `\n  ${green('➜')}  ${bold('Watching')}: ${dim(path.resolve(contentDir))}`,
  );
  console.log(
    `  ${green('➜')}  ${bold('Output')}:   ${dim(path.resolve(outDir))}\n`,
  );

  await builder(config);

  const watcher = Deno.watchFs(contentDir);
  let timer: ReturnType<typeof setTimeout> | undefined;

  for await (const event of watcher) {
    if (['create', 'modify', 'rename', 'remove'].includes(event.kind)) {
      const hasJson = event.paths.some(
        (p) => p.endsWith('.json'),
      );

      if (hasJson) {
        if (timer) clearTimeout(timer);

        timer = setTimeout(async () => {
          const startTime = performance.now();
          await builder(config);

          const duration = performance.now() - startTime;
          const filePath = path.relative(Deno.cwd(), event.paths[0].trim());
          logUpdate(filePath, duration);

          timer = undefined;
        }, 100);
      }
    }
  }
}
