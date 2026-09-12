import { slug } from '@dep/slug';
import { basename } from '@dep/path';

export type ImportsMap = Record<string, Record<string, string>>;

export async function generateJsonImports(
  importsMap: ImportsMap,
  outDir: string,
): Promise<void> {
  const lines: Array<string> = [];
  const exports: Array<string> = [];

  for (const [group, imports] of Object.entries(importsMap)) {
    const groupId = slug(group, { lowercase: false, separator: '' });
    const entries: Array<string> = [];

    for (const [name, path] of Object.entries(imports)) {
      lines.push(`import ${name} from '${path}' with { type: 'json' };`);
      entries.push(`${basename(path).replace('.json', '')}: ${name}`);
    }

    exports.push(`export const ${groupId} = { ${entries.join(', ')} };`);
  }

  lines.push(...exports);

  await Deno.writeTextFile(`${outDir}/main.ts`, lines.join('\n'));
}
