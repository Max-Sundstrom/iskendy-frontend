import { build } from 'vite';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sourceProvenance } from './release-utils.mjs';

export const demoBase = '/iskendy-frontend/';

/** Standalone fixtures-only artifact. The normal release config and boot remain unchanged. */
export async function buildCloudDemo(outDir = 'dist-demo') {
  await build({
    mode: 'mock',
    base: demoBase,
    publicDir: false,
    plugins: [
      {
        name: 'isolated-cloud-demo',
        transformIndexHtml: {
          order: 'pre',
          handler(html, context) {
            let transformed = html;
            if (context.filename === resolve('index.html'))
              transformed = transformed.replace(
                'src="/src/boot/main.ts"',
                'src="/dev/cloud.ts"',
              );
            return {
              html: transformed
                .replaceAll(
                  'href="/assets/favicon.png"',
                  `href="${demoBase}assets/favicon.png"`,
                )
                .replaceAll(
                  'href="/dev/scenario.html',
                  `href="${demoBase}dev/scenario.html`,
                )
                .replace(
                  /<a\b[^>]*href="\/dev\/manual\.html"[^>]*>[\s\S]*?<\/a\s*>/g,
                  '',
                ),
              tags: [
                {
                  tag: 'meta',
                  attrs: { name: 'robots', content: 'noindex, nofollow' },
                  injectTo: 'head',
                },
              ],
            };
          },
        },
        async generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'assets/favicon.png',
            source: await readFile('legacy/assets/favicon.png'),
          });
        },
      },
    ],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: resolve('index.html'),
          scenarios: resolve('dev/scenarios.html'),
          scenario: resolve('dev/scenario.html'),
        },
      },
    },
  });
  await mkdir(join(outDir, 'board'), { recursive: true });
  await cp(join(outDir, 'index.html'), join(outDir, 'board/index.html'));
  await writeFile(join(outDir, '.nojekyll'), '');
  const { commit, dirty } = await sourceProvenance();
  await writeFile(
    join(outDir, 'demo-version.json'),
    JSON.stringify({ commit, dirty, mode: 'mock', backend: 'fixtures' }) + '\n',
  );
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href)
  await buildCloudDemo();
