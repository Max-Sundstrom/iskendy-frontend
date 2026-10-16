import { expect, test } from '@playwright/test';

test('direct guest URLs and refresh work on a strict static host', async ({
  page,
}, info) => {
  for (const [path, heading] of [
    ['', 'Где мой заказ?'],
    ['board?my=1', 'Где мой заказ?'],
    ['board?view=help', 'Помощь'],
    ['board/?view=queue', 'Табло'],
    ['board/index.html?view=help', 'Помощь'],
  ] as const) {
    expect((await page.goto(path))?.status()).toBe(200);
    const expectedQuery = path.includes('?') ? '?' + path.split('?')[1] : '';
    expect(new URL(page.url()).search).toBe(expectedQuery);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect((await page.reload())?.status()).toBe(200);
    expect(new URL(page.url()).search).toBe(expectedQuery);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto('');
  await expect(
    page.getByRole('heading', { name: 'Где мой заказ?', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath('cloud-entry.png'),
    fullPage: true,
  });
});

test('first order, navigation and reload stay inside the demo', async ({
  page,
  baseURL,
}, info) => {
  const unexpected: string[] = [];
  const api: boolean[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL!).origin)
      unexpected.push(request.url());
  });
  page.on('response', (response) => {
    if (new URL(response.url()).pathname.startsWith('/api/'))
      api.push(response.fromServiceWorker());
  });
  await page.goto('dev/scenario.html?preset=entry');
  const field = page.getByRole('textbox', {
    name: 'Номер заказа',
    exact: true,
  });
  await field.fill('112');
  await expect(field).toHaveValue('112');
  await page
    .getByRole('button', { name: 'Показать статус', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Заказ 112, Готовим', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Заказ 112, Готовим', exact: true }),
  ).toBeVisible();
  for (const name of ['Помощь', 'Табло', 'Мои заказы']) {
    const link = page
      .getByRole('navigation', { name: 'Основная навигация' })
      .getByRole('link', { name, exact: true });
    await expect(link).toHaveAttribute('href', /\/iskendy-frontend\//);
    await link.click();
    expect(page.url()).toContain(new URL(baseURL!).pathname);
    expect((await page.reload())?.status()).toBe(200);
    await expect(page.locator('#root')).not.toBeEmpty();
  }
  await page.screenshot({
    path: info.outputPath('cloud-orders.png'),
    fullPage: true,
  });
  expect(unexpected).toEqual([]);
  expect(api.length).toBeGreaterThan(0);
  expect(api.every(Boolean)).toBe(true);
});

test('issued order accepts all five synthetic emotions', async ({
  page,
}, info) => {
  for (const rating of [1, 2, 3, 4, 5]) {
    await page.goto('dev/scenario.html?preset=issued');
    await page
      .getByRole('button', { name: 'Заказ 997, Выдан', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Оставить отзыв', exact: true })
      .click();
    const dialog = page.getByRole('dialog', {
      name: 'Оценка заказа 997',
      exact: true,
    });
    const slider = dialog.getByRole('slider');
    await slider.focus();
    await slider.press('Home');
    for (let i = 1; i < rating; i++) await slider.press('ArrowRight');
    await dialog.getByRole('button', { name: 'Дальше', exact: true }).click();
    await expect(
      dialog.getByText('Можно выбрать несколько — или пропустить'),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Дальше', exact: true }).click();
    await dialog.getByRole('textbox').fill('Синтетическая облачная проверка');
    await dialog.getByRole('textbox').blur();
    await dialog
      .getByRole('button', { name: 'Отправить отзыв', exact: true })
      .click();
    await expect(
      page
        .getByRole('dialog', { name: 'Спасибо', exact: true })
        .getByRole('heading', { name: 'Спасибо вам большое', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          window.__ISKENDY_TEST__!.requests.filter(
            (path) => path === '/api/feedback',
          ).length,
      ),
    ).toBe(1);
  }
  await page.screenshot({
    path: info.outputPath('cloud-rating.png'),
    fullPage: true,
  });
});

test('scenario menu, business errors and manager limitation are honest', async ({
  page,
}) => {
  await page.goto('dev/scenarios.html');
  await expect(
    page.getByText('Это демонстрация:', { exact: false }),
  ).toBeVisible();
  expect(
    await page
      .getByRole('navigation', { name: 'Выбор тестового сценария' })
      .getByRole('link')
      .count(),
  ).toBeGreaterThanOrEqual(20);
  await page
    .getByRole('link', { name: 'Лимит подписки (429)', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Где мой заказ?', exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole('textbox', { name: 'Номер заказа', exact: true })
    .fill('112');
  await page
    .getByRole('button', { name: 'Показать статус', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Много гостей сразу' }),
  ).toBeVisible();
  await page.goto('dev/scenario.html?preset=manager');
  const mutations: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST')
      mutations.push(new URL(request.url()).pathname);
  });
  await page
    .getByRole('button', {
      name: 'Оставить сообщение управляющему',
      exact: true,
    })
    .click();
  await page
    .getByRole('textbox', { name: 'Что случилось?', exact: true })
    .fill('Проверка недоступной отправки');
  await page
    .getByRole('textbox', { name: 'Что случилось?', exact: true })
    .blur();
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'synthetic.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('synthetic'),
    });
  await page
    .getByRole('button', { name: 'Отправить сообщение', exact: true })
    .click();
  await expect(
    page.getByText('Не удалось отправить сообщение.', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Что случилось?', exact: true }),
  ).toHaveValue('Проверка недоступной отправки');
  await page
    .getByRole('button', { name: 'Удалить synthetic.pdf', exact: true })
    .click();
  await expect(page.getByText('synthetic.pdf', { exact: true })).toHaveCount(0);
  expect(
    mutations.filter(
      (path) => !/^\/api\/(guest\/event|client\/event)$/.test(path),
    ),
  ).toEqual([]);
});

test('unknown mock API is blocked by the worker rather than sent to the network', async ({
  page,
}) => {
  await page.goto('');
  await expect(
    page.getByRole('heading', { name: 'Где мой заказ?', exact: true }),
  ).toBeVisible();
  for (const [path, method] of [
    ['/api/__unknown_cloud_check', 'GET'],
    ['/api/__unknown_cloud_check', 'POST'],
    ['/api/status', 'POST'],
    ['/api/%', 'GET'],
  ]) {
    const response = page.waitForResponse(
      (r) => new URL(r.url()).pathname === path,
    );
    const status = await page.evaluate(
      async ({ path, method }) => (await fetch(path!, { method })).status,
      { path, method },
    );
    expect(status).toBe(501);
    expect((await response).fromServiceWorker()).toBe(true);
  }
});

test('staff, production workers and real API are absent', async ({
  request,
  baseURL,
}) => {
  for (const path of [
    'staff',
    'stats',
    'tv',
    'legacy.html',
    'sw.js',
    'missing',
  ]) {
    expect((await request.get(new URL(path, baseURL).href)).status()).toBe(404);
  }
  expect(
    (await request.get(new URL('/api/status', baseURL).href)).status(),
  ).toBe(404);
  const index = await request.get(baseURL!);
  expect(await index.text()).toContain('noindex');
});
