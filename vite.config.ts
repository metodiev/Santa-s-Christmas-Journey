import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function serviceWorkerPrecache(): Plugin {
  let outDir = 'dist';
  return {
    name: 'scj-service-worker-precache',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files = walk(outDir);
      const precache = ['./'];
      const seen = new Set<string>();
      for (const file of files) {
        const name = relative(outDir, file).split('\\').join('/');
        if (name === 'sw.js' || name.endsWith('.map') || name.startsWith('.')) continue;
        const path = name === 'index.html' ? './index.html' : `./${name}`;
        if (seen.has(path)) continue;
        seen.add(path);
        precache.push(path);
      }
      const version = `scj-${createHash('sha1').update(precache.join('|')).digest('hex').slice(0, 10)}`;
      const swPath = join(outDir, 'sw.js');
      const source = readFileSync(swPath, 'utf8')
        .replace('__BUILD_VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache));
      writeFileSync(swPath, source);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [serviceWorkerPrecache()],
  publicDir: 'public',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
  },
});
