// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PanelShell from './PanelShell';

describe('PanelShell', () => {
  it('renders the title and children', () => {
    render(<PanelShell title="People" onClose={() => {}}><p>body</p></PanelShell>);
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('fires onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PanelShell title="People" onClose={onClose}><p>body</p></PanelShell>);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
