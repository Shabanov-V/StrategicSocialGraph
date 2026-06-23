// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GraphSearch from './GraphSearch';

const PEOPLE = [
  { id: 1, name: 'Mom' },
  { id: 2, name: 'Dad' },
];

describe('GraphSearch', () => {
  it('lists people whose name matches the typed term', async () => {
    const user = userEvent.setup();
    render(<GraphSearch people={PEOPLE} onSelect={() => {}} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'Mo');
    expect(screen.getByRole('button', { name: 'Mom' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dad' })).not.toBeInTheDocument();
  });

  it('matches against recall when the name does not match', async () => {
    const user = userEvent.setup();
    const people = [
      { id: 1, name: 'Sasha', recall: "Tom's sister" },
      { id: 2, name: 'Dad' },
    ];
    render(<GraphSearch people={people} onSelect={() => {}} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'sister');
    expect(screen.getByRole('button', { name: /Sasha/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dad' })).not.toBeInTheDocument();
  });

  it('fires onSelect with the picked person id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GraphSearch people={PEOPLE} onSelect={onSelect} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'Dad');
    await user.click(screen.getByRole('button', { name: 'Dad' }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('distinguishes same-named people by recall and picks the right id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const people = [
      { id: 1, name: 'Sasha', recall: 'cousin' },
      { id: 2, name: 'Sasha', recall: 'work' },
    ];
    render(<GraphSearch people={people} onSelect={onSelect} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'Sasha');
    const workRow = screen.getByRole('button', { name: /work/ });
    expect(screen.getByRole('button', { name: /cousin/ })).toBeInTheDocument();
    await user.click(workRow);
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('clears the input and closes the dropdown after a pick', async () => {
    const user = userEvent.setup();
    render(<GraphSearch people={PEOPLE} onSelect={() => {}} />);
    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'Dad');
    await user.click(screen.getByRole('button', { name: 'Dad' }));
    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Dad' })).not.toBeInTheDocument();
  });

  it('shows no dropdown when the input is empty', () => {
    render(<GraphSearch people={PEOPLE} onSelect={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
