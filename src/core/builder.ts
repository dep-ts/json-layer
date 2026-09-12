import { parseJSON } from '@/utils/parse.ts';
import { getMtime } from '@/utils/mtime.ts';
import { useCache } from '@/utils/cache.ts';
import { slug } from '@dep/slug';
import * as fs from '@std/fs';
import * as path from '@dep/path';
import { formatPathIdentifier } from '@/utils/format.ts';
import { logDirNotFound } from '@/utils/log.ts';
import { generateJsonImports, ImportsMap } from '@/utils/main.ts';
import { JsonLayerConfig } from './config.ts';
import { hasUnknown } from '@/utils/unknown.ts';

/**
 * Generates static import maps from JSON files with schema validation.
 *
 * @param config Configuration for directories, validation, and exclusions.
 * @returns Resolves when the build and cache update are complete.
 * @throws Propagates errors from file access, JSON parsing, or schema validation.
 *
 * @example
 * ```ts
 * import { builder } from '@dep/json-layer';
 * import { s } from '@dep/schema';
 *
 * await builder({
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
export async function builder(config: JsonLayerConfig = {}): Promise<void> {
  if ('ok' in config) {
    if (!config.ok) return;
  }

  const contentDir = config.contentDir ?? './content';
  const outDir = config.outDir ?? '.json-layer';
  const docType = config.docType ?? 'Content';
  const exclude = config.exclude ?? [];
  const schemas = config.schemas ?? {};

  if (!fs.existsSync(contentDir)) {
    logDirNotFound(contentDir);
    return;
  }

  const configHash = (async () => {
    if ('configPath' in config && typeof config.configPath === 'string') {
      return String(await getMtime(config.configPath));
    }
    return `${contentDir}$${outDir}$${docType}$${exclude}`;
  })();

  const cache = await useCache(outDir);
  const cachedConfig = await cache.get('config');
  const importsMap: ImportsMap = {};
  const absoluteContentPath = path.resolve(contentDir);
  let hasChanges = false;

  for await (const entry of fs.expandGlob(`${contentDir}/**/*.+(json)`)) {
    const jsonFile = path.relative(absoluteContentPath, entry.path);
    if (
      exclude.some((term) => jsonFile.includes(term))
    ) {
      continue;
    }

    const mtimeNum = Number(await getMtime(entry.path));
    const cachedMtime = await cache.get(entry.path);

    const internalDir = path.dirname(jsonFile);
    const groupName = `${docType}${formatPathIdentifier(internalDir)}`;
    const importIdentifier = slug(jsonFile, { separator: '' });

    if (cachedMtime !== mtimeNum || cachedConfig !== (await configHash)) {
      hasChanges = true;

      if (schemas[groupName]) {
        const jsonData = await parseJSON(entry);
        await schemas[groupName].parseAsync(jsonData);
      }

      await cache.set(entry.path, mtimeNum);
    }

    importsMap[groupName] ??= {};
    importsMap[groupName][importIdentifier] = `./${
      path.relative(outDir, path.join(contentDir, jsonFile))
    }`;
  }

  if (hasUnknown('schema', schemas, importsMap)) return;

  if (hasChanges) {
    await generateJsonImports(importsMap, outDir);
    await cache.set('config', await configHash);
  }
}
