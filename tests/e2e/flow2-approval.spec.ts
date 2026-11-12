import { expect, test, type Page } from '@playwright/test';

async function loginAs(page: Page, name: RegExp) {
  await page.goto('/login');
  await page.getByRole('button', { name }).click();
  await expect(page).toHaveURL(/\/my-space$/);
}

async function logout(page: Page) {
  await page.getByRole('button', { name: /^เมนูผู้ใช้:/ }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function approveAs(page: Page, name: RegExp, summary: string, step: string) {
  await loginAs(page, name);
  await page.getByRole('link', { name: 'อนุมัติ' }).first().click();
  const row = page.getByRole('listitem').filter({ hasText: summary });
  await expect(row).toContainText(`ขั้น ${step}`);
  await row.getByRole('button', { name: 'อนุมัติ' }).click();
  await expect(page.getByText(`อนุมัติ #100010 (${step}) แล้ว`)).toBeVisible();
  await logout(page);
}

// Critical Path 2 (testing-strategy.md): Service Request with Department → Head approval.
test('Flow 2 — Add New User goes through both approvals, then the SLA starts', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear()); // fresh seed for every run
  await loginAs(page, /สมชาย/);

  await page.getByRole('link', { name: 'Service Catalog' }).first().click();
  await page.getByRole('link', { name: /User Access/ }).click();
  await page.getByRole('link', { name: 'Request this service: Add New User' }).first().click();
  await expect(page).toHaveURL(/\/calls\/new\?service=sdf_010/);

  const summary = 'ขอเพิ่มผู้ใช้ใหม่ พนักงานเข้าใหม่ (E2E)';
  await page.getByRole('textbox', { name: 'Summary' }).fill(summary);
  await page.getByRole('textbox', { name: 'Notes' }).fill('ผู้ใช้ตัวอย่าง เริ่มงานสัปดาห์หน้า');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByText('สร้าง Support Call #100010 แล้ว')).toBeVisible();
  const detailUrl = page.url();
  await expect(page.getByText('Waiting For Approve').first()).toBeVisible();
  await expect(page.getByText('รออนุมัติ').first()).toBeVisible(); // SLA not started yet
  await logout(page);

  await approveAs(page, /ปรีชา/, summary, 'Department approval');
  await approveAs(page, /อรุณี/, summary, 'Head approval');

  await loginAs(page, /สมชาย/);
  await page.goto(detailUrl);
  await expect(page.getByRole('heading', { level: 1, name: summary })).toBeVisible();
  await expect(page.getByText('Request In-Progress').first()).toBeVisible();
  // 3-Medium × 4-Minor = P4 = 72h from Head approval, counted from now
  const timeLeft = page.locator('dt', { hasText: 'Time Left' }).locator('xpath=following-sibling::dd[1]');
  await expect(timeLeft).toHaveText(/^[23] days \d{2}:\d{2}$/);
});
