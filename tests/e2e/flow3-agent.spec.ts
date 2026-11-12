import { expect, test } from '@playwright/test';

// Critical Path 3 (testing-strategy.md): agent finds an open call, works it and resolves it with a closure category.
test('Flow 3 — ธนา moves call_001 to In Process, then Resolved', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear()); // fresh seed for every run
  await page.goto('/login');
  await page.getByRole('button', { name: /ธนา/ }).click();
  await expect(page).toHaveURL(/\/my-space$/);

  await page.getByRole('link', { name: 'ค้นหาเรื่อง' }).first().click();
  await page.getByRole('group', { name: 'Open / Closed' }).getByRole('button', { name: 'Open' }).click();
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('link', { name: 'เปิดเรื่อง 100001: Mouse ใช้งานไม่ได้' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mouse ใช้งานไม่ได้' })).toBeVisible();

  const timeline = page.locator('ol').filter({ has: page.locator('time') });
  const before = await timeline.locator(':scope > li').count();

  await page.getByRole('button', { name: 'เปลี่ยนสถานะเป็น In Process' }).click();
  await expect(page.getByText('เปลี่ยนสถานะเป็น In Process แล้ว')).toBeVisible();

  await page.getByRole('button', { name: 'เปลี่ยนสถานะเป็น Resolved' }).click();
  const dialog = page.getByRole('dialog', { name: 'เปลี่ยนเป็น Resolved' });
  await dialog.getByRole('button', { name: 'บันทึก' }).click();
  await expect(dialog.locator('#closure-error')).toBeVisible(); // required: error shown, dialog stays
  await dialog.getByRole('combobox', { name: 'Closure Category' }).click();
  await page.getByRole('option', { name: 'Replaced Hardware' }).click();
  await dialog.getByLabel('หมายเหตุ (ถ้ามี)').fill('เปลี่ยนเมาส์ใหม่ให้แล้ว');
  await dialog.getByRole('button', { name: 'บันทึก' }).click();
  await expect(page.getByText('เปลี่ยนสถานะเป็น Resolved แล้ว')).toBeVisible();
  await expect(dialog).toBeHidden();

  // timeline gained both transitions, by ธนา, in order, with the resolve note
  const items = timeline.locator(':scope > li');
  await expect(items).toHaveCount(before + 2);
  await expect(items.nth(before)).toContainText('In Process');
  await expect(items.nth(before)).toContainText('ธนา');
  await expect(items.nth(before + 1)).toContainText('Resolved');
  await expect(items.nth(before + 1)).toContainText('ธนา');
  await expect(items.nth(before + 1)).toContainText('เปลี่ยนเมาส์ใหม่ให้แล้ว');
  // Resolved has no further agent transition in the Incident state machine
  await expect(page.getByRole('button', { name: 'เปลี่ยนสถานะเป็น In Process' })).toHaveCount(0);
});
