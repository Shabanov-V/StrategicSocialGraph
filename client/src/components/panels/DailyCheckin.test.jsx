// @vitest-environment jsdom
import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DailyCheckin from './DailyCheckin';
import { getContactDates } from '../../graph-document';
import { checkinDayISO } from '../../utils/contact-time';

const TODAY = checkinDayISO();

function Harness({ initial }) {
  const [yamlText, setYamlText] = useState(initial);
  return (
    <>
      <DailyCheckin yamlText={yamlText} setYamlText={setYamlText} />
      <pre data-testid="yaml">{yamlText}</pre>
    </>
  );
}

const yaml = () => screen.getByTestId('yaml').textContent;

afterEach(() => vi.restoreAllMocks());

const TWO = `people:
  - id: 1
    name: Mom
    circle: 1
  - id: 2
    name: Dad
    circle: 1
`;

describe('DailyCheckin', () => {
  it('pre-checks people already contacted today', () => {
    const initial = `people:
  - id: 1
    name: Mom
    circle: 1
    contacts:
      - ${TODAY}
  - id: 2
    name: Dad
    circle: 1
`;
    render(<Harness initial={initial} />);
    expect(screen.getByRole('checkbox', { name: 'Mom' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Dad' })).not.toBeChecked();
  });

  it('Save stamps today onto newly checked people', async () => {
    const user = userEvent.setup();
    render(<Harness initial={TWO} />);
    await user.click(screen.getByRole('checkbox', { name: 'Dad' }));
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(getContactDates(yaml(), 2)).toEqual([TODAY]);
    expect(getContactDates(yaml(), 1)).toEqual([]);
  });

  it('Save removes today from unchecked people but keeps older dates', async () => {
    const user = userEvent.setup();
    const initial = `people:
  - id: 1
    name: Mom
    circle: 1
    contacts:
      - '2026-01-01'
      - ${TODAY}
`;
    render(<Harness initial={initial} />);
    await user.click(screen.getByRole('checkbox', { name: 'Mom' })); // uncheck
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(getContactDates(yaml(), 1)).toEqual(['2026-01-01']);
  });

  it('changing the date re-seeds checkboxes from that date\'s log', () => {
    const initial = `people:
  - id: 1
    name: Mom
    circle: 1
    contacts:
      - '2026-01-01'
  - id: 2
    name: Dad
    circle: 1
`;
    render(<Harness initial={initial} />);
    // Today: nobody logged.
    expect(screen.getByRole('checkbox', { name: 'Mom' })).not.toBeChecked();
    // Move to the day Mom was logged.
    fireEvent.change(screen.getByLabelText(/check-in date/i), { target: { value: '2026-01-01' } });
    expect(screen.getByRole('checkbox', { name: 'Mom' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Dad' })).not.toBeChecked();
  });

  it('Save writes contacts onto the selected past date', async () => {
    const user = userEvent.setup();
    render(<Harness initial={TWO} />);
    fireEvent.change(screen.getByLabelText(/check-in date/i), { target: { value: '2026-01-01' } });
    await user.click(screen.getByRole('checkbox', { name: 'Dad' }));
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(getContactDates(yaml(), 2)).toEqual(['2026-01-01']);
  });

  it('caps the date input at the Check-in Day (no future)', () => {
    render(<Harness initial={TWO} />);
    expect(screen.getByLabelText(/check-in date/i)).toHaveAttribute('max', TODAY);
  });

  it('guards a dirty date switch: Cancel keeps the date and the edits', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Harness initial={TWO} />);
    await user.click(screen.getByRole('checkbox', { name: 'Dad' })); // make dirty
    fireEvent.change(screen.getByLabelText(/check-in date/i), { target: { value: '2026-01-01' } });
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByLabelText(/check-in date/i)).toHaveValue(TODAY); // date unchanged
    expect(screen.getByRole('checkbox', { name: 'Dad' })).toBeChecked(); // edit kept
  });

  it('guards a dirty date switch: OK discards and re-seeds for the new date', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Harness initial={TWO} />);
    await user.click(screen.getByRole('checkbox', { name: 'Dad' })); // make dirty
    fireEvent.change(screen.getByLabelText(/check-in date/i), { target: { value: '2026-01-01' } });
    expect(screen.getByLabelText(/check-in date/i)).toHaveValue('2026-01-01');
    expect(screen.getByRole('checkbox', { name: 'Dad' })).not.toBeChecked(); // discarded
  });

  it('does not prompt when switching the date with no unsaved edits', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Harness initial={TWO} />);
    fireEvent.change(screen.getByLabelText(/check-in date/i), { target: { value: '2026-01-01' } });
    expect(confirm).not.toHaveBeenCalled();
  });

  it('Save resets the baseline so the next date switch does not prompt', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Harness initial={TWO} />);
    await user.click(screen.getByRole('checkbox', { name: 'Dad' }));
    await user.click(screen.getByRole('button', { name: /save/i }));
    fireEvent.change(screen.getByLabelText(/check-in date/i), { target: { value: '2026-01-01' } });
    expect(confirm).not.toHaveBeenCalled();
  });

  it('search filters the visible people by name', async () => {
    const user = userEvent.setup();
    render(<Harness initial={TWO} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'Mo');
    expect(screen.getByRole('checkbox', { name: 'Mom' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Dad' })).not.toBeInTheDocument();
  });
});
