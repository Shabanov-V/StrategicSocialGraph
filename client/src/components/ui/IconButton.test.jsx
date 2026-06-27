// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import IconButton from './IconButton';

describe('IconButton', () => {
  it('exposes the label as accessible name', () => {
    render(<IconButton label="Add person"><span>+</span></IconButton>);
    expect(screen.getByRole('button', { name: 'Add person' })).toBeInTheDocument();
  });

  it('sets a title tooltip equal to the label', () => {
    render(<IconButton label="Settings"><span>⚙</span></IconButton>);
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('title', 'Settings');
  });

  it('marks the active state with a class', () => {
    render(<IconButton label="Edit YAML" active><span>x</span></IconButton>);
    expect(screen.getByRole('button', { name: 'Edit YAML' }).className).toMatch(/active/);
  });

  it('forwards onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton label="Go" onClick={onClick}><span>x</span></IconButton>);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
