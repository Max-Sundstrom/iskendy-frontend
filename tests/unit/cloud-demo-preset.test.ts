import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyLinkedManualPreset,
  prepareCloudDemoPreset,
} from '../../dev/manual-presets';
import { fixtureResponse, resetFixtures } from '../msw/handlers';

beforeEach(() => {
  vi.stubEnv('MODE', 'mock');
  localStorage.clear();
  sessionStorage.clear();
  resetFixtures();
});
afterEach(() => vi.unstubAllEnvs());

describe('cloud demo session initialization', () => {
  it('starts interactive entry without seeding or clearing saved records', async () => {
    localStorage.setItem('iskendi_my_order', 'saved order');
    localStorage.setItem('iskendy_orders_v1:confirmed', 'saved journal');
    sessionStorage.setItem('iskendy_selected_order_v1', 'saved selection');
    prepareCloudDemoPreset();
    applyLinkedManualPreset();
    expect(sessionStorage.getItem('iskendy_linked_manual_preset')).toBe(
      'entry',
    );
    expect(sessionStorage.getItem('iskendy_linked_manual_seed')).toBeNull();
    const response = await fixtureResponse(
      '/api/guest/claim',
      new Request('http://localhost/api/guest/claim', {
        method: 'POST',
        body: JSON.stringify({ number: 102 }),
      }),
    );
    expect(await response.json()).toMatchObject({ ok: true, number: 102 });
    expect(localStorage.getItem('iskendi_my_order')).toBe('saved order');
    expect(localStorage.getItem('iskendy_orders_v1:confirmed')).toBe(
      'saved journal',
    );
    expect(sessionStorage.getItem('iskendy_selected_order_v1')).toBe(
      'saved selection',
    );
  });
  it('keeps an explicit scenario on reload without reseeding', () => {
    sessionStorage.setItem('iskendy_linked_manual_preset', 'positive');
    sessionStorage.setItem('iskendy_linked_manual_seed', '1');
    prepareCloudDemoPreset();
    applyLinkedManualPreset();
    localStorage.setItem('iskendi_my_order', 'confirmed feedback');
    resetFixtures();
    prepareCloudDemoPreset();
    applyLinkedManualPreset();
    expect(localStorage.getItem('iskendi_my_order')).toBe('confirmed feedback');
    expect(sessionStorage.getItem('iskendy_linked_manual_preset')).toBe(
      'positive',
    );
    expect(sessionStorage.getItem('iskendy_linked_manual_seed')).toBeNull();
  });
  it('does not override an existing manual choice or enable production mocks', () => {
    sessionStorage.setItem('iskendy_manual_preset', 'orders2');
    prepareCloudDemoPreset();
    expect(sessionStorage.getItem('iskendy_linked_manual_preset')).toBeNull();
    sessionStorage.clear();
    vi.stubEnv('MODE', 'production');
    prepareCloudDemoPreset();
    expect(sessionStorage.length).toBe(0);
  });
});
