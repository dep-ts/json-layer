// deno-lint-ignore-file no-explicit-any
import { resolveConfigPath } from '@/utils/path.ts';
import { toFileUrl } from '@dep/path';
import { bold, red } from '@std/fmt/colors';

/**
 * Configuration options for the JsonLayer build process.
 */
export interface JsonLayerConfig {
  /** The directory containing source JSON content. Defaults to `./content`. */
  contentDir?: string;
  /** The output directory for the generated main.ts index. Defaults to `.json-layer`. */
  outDir?: string;
  /** The base name for the exported TypeScript constants. Defaults to `Content`. */
  docType?: string;
  /** Substrings to ignore in file paths (e.g., ['_drafts', '.temp']). */
  exclude?: Array<string>;
  /** Validation schemas (e.g., from `@dep/schema`) to enforce structure per group. */
  schemas?: Record<
    string,
    {
      parseAsync: (
        data: unknown,
      ) => Promise<
        string | number | boolean | null | Array<any> | Record<PropertyKey, any>
      >;
      type:
        | 'lazy'
        | 'json'
        | 'string'
        | 'number'
        | 'boolean'
        | 'null'
        | 'array'
        | 'record';
    }
  >;
}

/**
 * Helper function to provide type-safety when defining a configuration file.
 * * @param config The JsonLayer configuration object.
 * @returns The validated configuration object.
 */
export function defineConfig(
  config: JsonLayerConfig,
): JsonLayerConfig {
  return config;
}

/**
 * Dynamically loads the configuration file from the filesystem.
 * * @param configPath Optional explicit path to a config file.
 * If omitted, it looks for `json-layer.config.ts` in the current working directory.
 * @returns The loaded configuration merged with the detected config path.
 */
export async function loadConfig(
  configPath?: string,
): Promise<JsonLayerConfig & { configPath?: string; ok?: boolean }> {
  const filePath = resolveConfigPath(configPath);

  if (!filePath) {
    return {};
  }

  try {
    const fileUrl = toFileUrl(filePath);
    const modulePath = `${fileUrl.href}?update=${Date.now()}`;
    const mod = await import(modulePath);
    const config = mod.default ?? mod;

    if (config && typeof config === 'object') {
      return { ...config, configPath: filePath };
    }

    return { configPath: filePath };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n  ${red(bold('Error:'))} ${error.message}`);
    }
    return { ok: false };
  }
}
