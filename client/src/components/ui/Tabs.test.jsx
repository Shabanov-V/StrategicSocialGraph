// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Tabs from './Tabs';

const tabs = [{ id: 'add', label: 'Add' }, { id: 'edit', label: 'Edit' }];

describe('Tabs', () => {
  it('renders a tablist of the given tabs', () => {
    render(<Tabs tabs={tabs} active="add" onChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Add' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Edit' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="add" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Edit' }));
    expect(onChange).toHaveBeenCalledWith('edit');
  });

  it('moves selection with ArrowRight', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="add" onChange={onChange} />);
    screen.getByRole('tab', { name: 'Add' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('edit');
  });
});
