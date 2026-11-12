import { expect, test } from '@playwright/test';

// Critical Path 1 (testing-strategy.md): requestor reports an Incident from the Service Catalog.
test('Flow 1 — สมชาย reports a Keyboard incident from the catalog', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear()); // fresh seed for every run
  await page.goto('/login');
  await page.getByRole('button', { name: /สมชาย/ }).click();
  await expect(page).toHaveURL(/\/my-space$/);

  await page.getByRole('link', { name: 'Service Catalog' }).first().click();
  await page.getByRole('link', { name: /Report Incident/ }).click();
  await page.getByRole('link', { name: /Hardware \/ Notebook \/ PC/ }).click();
  await page.getByRole('link', { name: 'Request this service: Keyboard - Incident' }).first().click();
  await expect(page).toHaveURL(/\/calls\/new\?service=sdf_001/);

  const summary = 'Keyboard กดปุ่ม Enter ไม่ติด (E2E)';
  await page.getByRole('textbox', { name: 'Summary' }).fill(summary);
  await page.getByRole('textbox', { name: 'Notes' }).fill('ปุ่ม Enter ต้องกดซ้ำหลายครั้ง');
  await page.getByRole('button', { name: 'OK' }).click();

  // seed runningNumber = 100009 → the new call is #100010
  await expect(page.getByText('สร้าง Support Call #100010 แล้ว')).toBeVisible();
  await expect(page).toHaveURL(/\/calls\/call_/);
  await expect(page.getByText('Support Call #100010', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: summary })).toBeVisible();

  await page.getByRole('link', { name: 'My Space' }).first().click();
  const logged = page.locator('section').filter({ has: page.getByRole('heading', { name: /Calls Logged For You/ }) });
  await expect(logged.getByText(/Count: 5/)).toBeVisible();
  await expect(logged.getByText(summary).first()).toBeVisible();
});
