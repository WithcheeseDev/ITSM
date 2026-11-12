import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { dataStore } from '@/data/repositories';
import { CallFormPage } from '@/features/call-form/CallFormPage';
import { MESSAGES } from '@/features/calls/callService';
import { renderAt, resetApp, silenceLogs, stubBrowserApis } from './helpers';

const openForm = (url = '/calls/new?service=sdf_002') => {
  resetApp('usr_001');
  renderAt(url, '/calls/new', <CallFormPage />);
};

describe('Call form validation', () => {
  beforeEach(() => {
    silenceLogs();
    stubBrowserApis();
  });

  it('shows the §4.5 messages under empty required fields and saves nothing', async () => {
    openForm();
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(screen.getByText(MESSAGES.summary)).toBeTruthy());
    expect(screen.getByText(MESSAGES.notes)).toBeTruthy();
    const summary = screen.getByRole('textbox', { name: 'Summary' });
    expect(summary.getAttribute('aria-invalid')).toBe('true');
    expect(summary.getAttribute('aria-describedby')).toBeTruthy();
    const described = summary.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent ?? '');
    expect(described.some((t) => t.includes(MESSAGES.summary))).toBe(true);
    expect(dataStore.getDataset().supportCalls).toHaveLength(9);
  });

  it('flags a bad e-mail and phone', async () => {
    openForm();
    const email = screen.getByRole('textbox', { name: 'E-mail' });
    const phone = screen.getByRole('textbox', { name: /Phone number/ });
    await userEvent.clear(email);
    await userEvent.type(email, 'not-an-email');
    await userEvent.clear(phone);
    await userEvent.type(phone, '12');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(screen.getByText(MESSAGES.email)).toBeTruthy());
    expect(screen.getByText(MESSAGES.phone)).toBeTruthy();
  });

  it('asks for a template on the direct form', async () => {
    openForm('/calls/new');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(screen.getByText(MESSAGES.template)).toBeTruthy());
  });

  it('flags a summary over 200 characters', async () => {
    openForm();
    const summary = screen.getByRole('textbox', { name: 'Summary' });
    await userEvent.click(summary);
    await userEvent.paste('ก'.repeat(201));
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(screen.getByText(MESSAGES.summaryLength)).toBeTruthy());
  });
});
