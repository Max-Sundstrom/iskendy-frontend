// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { execPath } from 'node:process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

let outDir;
beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'iskendy-cloud-build-'));
  const script = pathToFileURL(resolve('scripts/build-cloud-demo.mjs')).href;
  execFileSync(
    execPath,
    [
      '--input-type=module',
      '-e',
      `import { buildCloudDemo } from ${JSON.stringify(script)}; await buildCloudDemo(${JSON.stringify(outDir)});`,
    ],
    { stdio: 'pipe', timeout: 60_000 },
  );
}, 65_000);
afterAll(async () => {
  if (outDir) await rm(outDir, { recursive: true, force: true });
});

const read = (file) => readFile(join(outDir, file), 'utf8');
describe('isolated cloud artifact', () => {
  it('ships only guest pages, scenario launcher, local assets and the mock worker', async () => {
    expect((await readdir(outDir)).sort()).toEqual([
      '.nojekyll',
      'app',
      'assets',
      'board',
      'demo-version.json',
      'dev',
      'index.html',
      'mockServiceWorker.js',
    ]);
    expect(await readdir(join(outDir, 'board'))).toEqual(['index.html']);
    expect((await readdir(join(outDir, 'dev'))).sort()).toEqual([
      'scenario.html',
      'scenarios.html',
    ]);
    expect(await readdir(join(outDir, 'assets'))).toEqual(['favicon.png']);
    expect(await readFile(join(outDir, 'assets/favicon.png'))).toEqual(
      await readFile('legacy/assets/favicon.png'),
    );
    expect(await read('board/index.html')).toBe(await read('index.html'));
    expect(await read('mockServiceWorker.js')).toContain('Mock Service Worker');
    expect(JSON.parse(await read('demo-version.json'))).toMatchObject({
      commit: expect.stringMatching(/^[a-f0-9]{40}$/),
      dirty: expect.any(Boolean),
      mode: 'mock',
      backend: 'fixtures',
    });
  });
  it('keeps all HTML asset and scenario links under the Pages prefix and prevents indexing', async () => {
    for (const file of [
      'index.html',
      'dev/scenario.html',
      'dev/scenarios.html',
    ]) {
      const html = await read(file);
      expect(html).toContain('name="robots" content="noindex, nofollow"');
      expect(html).not.toMatch(/\/dev\/manual\.html|\/src\/boot\/main\.ts/);
      for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g))
        expect(url.startsWith('/iskendy-frontend/')).toBe(true);
    }
    expect(await read('dev/scenarios.html')).toContain(
      'href="/iskendy-frontend/dev/scenario.html?preset=entry"',
    );
  });
  it('excludes legacy loader, operational pages, source maps and the production service worker', async () => {
    const files = await readdir(outDir, { recursive: true });
    expect(
      files.some((file) =>
        /(?:^|\/)(?:staff|stats|tv|legacy|sw\.js)|\.map$/.test(file),
      ),
    ).toBe(false);
    const scripts = await Promise.all(
      files.filter((file) => file.endsWith('.js')).map(read),
    );
    expect(scripts.join('\n')).not.toMatch(/legacy\.html|iskendy_staff_token/);
    expect(scripts.join('\n')).toContain('__ISKENDY_TEST__');
  });
});
