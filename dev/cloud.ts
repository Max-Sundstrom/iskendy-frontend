import { bootstrapError } from '../src/content/bootstrap';
import { prepareCloudDemoPreset } from './manual-presets';
import { enableMocks } from '../tests/msw/browser';

async function startCloudDemo(): Promise<void> {
  if (import.meta.env.MODE !== 'mock')
    throw new Error('Cloud demo requires explicit mock mode');
  prepareCloudDemoPreset();
  await enableMocks();
  const { mountApp } = await import('../src/app/mount');
  mountApp();
}

void startCloudDemo().catch(() => {
  const message = document.createElement('p');
  message.textContent = bootstrapError.message;
  message.setAttribute('role', 'alert');
  const reload = document.createElement('button');
  reload.textContent = bootstrapError.action;
  reload.addEventListener('click', () => window.location.reload());
  document.body.replaceChildren(message, reload);
});
