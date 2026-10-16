import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BoardTile } from '../../src/ui/BoardTile/BoardTile';
import { ReturnBar } from '../../src/ui/ReturnBar/ReturnBar';

afterEach(() => vi.unstubAllEnvs());
it('keeps native new-tab links under the demo base while callbacks use logical routes', () => {
  vi.stubEnv('BASE_URL', '/iskendy-frontend/');
  const navigate = vi.fn();
  render(
    <>
      <BoardTile board={null} onNavigate={navigate} />
      <ReturnBar number="112" status="preparing" onNavigate={navigate} />
    </>,
  );
  const links = screen.getAllByRole('link');
  expect(links[0]).toHaveAttribute(
    'href',
    '/iskendy-frontend/board?view=queue',
  );
  expect(links[1]).toHaveAttribute('href', '/iskendy-frontend/board?my=1');
  for (const link of links) {
    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  }
  expect(fireEvent.click(links[0]!)).toBe(false);
  expect(navigate).toHaveBeenCalledWith('/board?view=queue');
  expect(fireEvent.click(links[1]!)).toBe(false);
  expect(navigate).toHaveBeenCalledWith('/board?my=1');
});
