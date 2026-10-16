/** Logical guest routes stay / and /board; the isolated static demo adds a host prefix. */
export function appPathname(
  pathname: string,
  base = import.meta.env.BASE_URL,
): string {
  if (base === '/') return pathname;
  const prefix = base.slice(0, -1);
  const path =
    pathname === prefix
      ? '/'
      : pathname.startsWith(base)
        ? pathname.slice(prefix.length)
        : pathname;
  if (path === '/index.html') return '/';
  if (path === '/board/' || path === '/board/index.html') return '/board';
  return path;
}

/** Navigation only: API calls retain /api paths; relative and external links stay intact. */
export function appHref(to: string, base = import.meta.env.BASE_URL): string {
  if (base === '/' || !/^\/(?!\/)/.test(to)) return to;
  if (to === base.slice(0, -1) || to.startsWith(base)) return to;
  return base + to.slice(1);
}
