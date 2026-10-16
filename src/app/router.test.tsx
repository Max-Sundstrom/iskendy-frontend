import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Link, useLocation, useNavigate } from './router';
function Where() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output>{pathname + search}</output>
      <button onClick={() => navigate('/board?view=help')}>push</button>
      <button onClick={() => navigate('/', { replace: true })}>replace</button>
      <Link to="/board?view=queue" className="c">
        board
      </Link>
    </>
  );
}
beforeEach(() => history.replaceState(null, '', '/board?my=1'));
afterEach(() => vi.unstubAllEnvs());
describe('own router (ADR-020)', () => {
  it('reads the address and pushes or replaces history entries', () => {
    render(<Where />);
    expect(screen.getByRole('status')).toHaveTextContent('/board?my=1');
    const length = history.length;
    fireEvent.click(screen.getByRole('button', { name: 'push' }));
    expect(screen.getByRole('status')).toHaveTextContent('/board?view=help');
    expect(history.length).toBe(length + 1);
    fireEvent.click(screen.getByRole('button', { name: 'replace' }));
    expect(screen.getByRole('status')).toHaveTextContent('/');
    expect(location.pathname + location.search).toBe('/');
    expect(history.length).toBe(length + 1);
  });
  it('follows browser back and forward', () => {
    render(<Where />);
    act(() => {
      history.pushState(null, '', '/board?view=queue');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('status')).toHaveTextContent('/board?view=queue');
  });
  it('routes plain clicks in-app and leaves modified clicks to the browser', () => {
    render(<Where />);
    const link = screen.getByRole('link', { name: 'board' });
    expect(link).toHaveAttribute('href', '/board?view=queue');
    expect(link).toHaveClass('c');
    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('/board?my=1');
    expect(fireEvent.click(link)).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('/board?view=queue');
  });
});

describe('router on static Pages hosting', () => {
  it('normalizes direct static URLs and keeps navigation and browser links under the base', () => {
    vi.stubEnv('BASE_URL', '/iskendy-frontend/');
    history.replaceState(null, '', '/iskendy-frontend/board/index.html?my=1');
    render(<Where />);
    expect(screen.getByRole('status')).toHaveTextContent('/board?my=1');
    expect(screen.getByRole('link', { name: 'board' })).toHaveAttribute(
      'href',
      '/iskendy-frontend/board?view=queue',
    );
    fireEvent.click(screen.getByRole('button', { name: 'push' }));
    expect(location.pathname + location.search).toBe(
      '/iskendy-frontend/board?view=help',
    );
    expect(history.state.guestReturnTo).toBe('/board?my=1');
    fireEvent.click(screen.getByRole('button', { name: 'replace' }));
    expect(location.pathname).toBe('/iskendy-frontend/');
    expect(screen.getByRole('status')).toHaveTextContent('/');
  });
});
