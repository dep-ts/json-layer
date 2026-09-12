# @dep/json-layer 🗂️

> A lightweight, type-safe JSON-to-TypeScript compiler and watcher for Deno.

## [![JSR version](https://jsr.io/badges/@dep/json-layer)](https://jsr.io/@dep/json-layer)

## Features ✨

- ⚡ **Incremental Builds**: Caches file modification times to skip unchanged files.
- 🛡️ **Schema Validation**: Validate JSON content with custom schemas per group.
- 🏗️ **Auto-Imports**: Generates a `main.ts` with static JSON imports.
- 🔄 **Watch Mode**: Automatically rebuilds when JSON files change.
- 🚫 **Path Exclusions**: Exclude files or directories from processing.

---

## Installation 📦

- **Deno**:

  ```bash
  deno add jsr:@dep/json-layer
  deno install -A -n json-layer jsr:@dep/json-layer/cli

---

## Usage 🎯

### CLI 💻

```bash
# Build content from ./content
json-layer build

# Watch for changes
json-layer build --watch

# Custom output directory
json-layer build --outDir ./dist/data

# Custom config file
json-layer build -c ./custom.config.ts

# Exclude paths
json-layer build --exclude drafts --exclude temp/
```

### API 🧩

```ts
import { builder, watcher } from '@dep/json-layer';

await builder();

// Or watch for changes
await watcher();
```

Configure the build with `json-layer.config.ts`:

```ts
import { defineConfig } from '@dep/json-layer';
import { s } from '@dep/schema';

export default defineConfig({
  contentDir: './content',
  outDir: './.json-layer',
  docType: 'Content',

  schemas: {
    ContentRoot: s.object({
      title: s.string(),
    }),
  },
});
```

Generated data is available through the generated `main.ts`:

```ts
import { ContentRoot } from './.json-layer/main.ts';

console.log(ContentRoot);
```

---

## License 📄

MIT License – see [LICENSE](LICENSE) for details.

**Author:** Estarlin R ([estarlincito.com](https://estarlincito.com))


