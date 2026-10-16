import { describe, expect, it } from 'vitest';
import { appHref, appPathname } from './base-path';

const base = '/iskendy-frontend/';
describe('isolated static demo base path', () => {
  it.each(['/', '/board', '/board/', '/tv', '/staff', '/stats'])(
    'keeps production pathname %s unchanged',
    (path) => expect(appPathname(path, '/')).toBe(path),
  );
  it.each([
    ['/iskendy-frontend', '/'],
    ['/iskendy-frontend/', '/'],
    ['/iskendy-frontend/index.html', '/'],
    ['/iskendy-frontend/board', '/board'],
    ['/iskendy-frontend/board/', '/board'],
    ['/iskendy-frontend/board/index.html', '/board'],
    ['/iskendy-frontend/staff', '/staff'],
    ['/iskendy-frontend-other/board', '/iskendy-frontend-other/board'],
  ])('maps %s to the logical route %s', (path, expected) => {
    expect(appPathname(path, base)).toBe(expected);
  });
  it.each([
    ['/', '/iskendy-frontend/'],
    ['/board?my=1', '/iskendy-frontend/board?my=1'],
    ['/board?view=help#question', '/iskendy-frontend/board?view=help#question'],
    [
      '/dev/scenario.html?preset=entry',
      '/iskendy-frontend/dev/scenario.html?preset=entry',
    ],
    ['/iskendy-frontend/board', '/iskendy-frontend/board'],
    ['?my=1', '?my=1'],
    ['#question', '#question'],
    ['https://example.test/', 'https://example.test/'],
    ['//example.test/', '//example.test/'],
    ['mailto:demo@example.test', 'mailto:demo@example.test'],
  ])('builds the navigation href %s', (path, expected) => {
    expect(appHref(path, base)).toBe(expected);
    expect(appHref(path, '/')).toBe(path);
  });
});
