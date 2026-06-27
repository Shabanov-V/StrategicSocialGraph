// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PersonSelect from './PersonSelect';

const options = [{ value: 'Alex', label: 'Alex' }, { value: 'Mom', label: 'Mom' }];

describe('PersonSelect', () => {
  it('renders the placeholder when no value is selected', () => {
    render(<PersonSelect value="" onChange={() => {}} options={options} placeholder="-- select person --" inputId="from" />);
    expect(screen.getByText('-- select person --')).toBeInTheDocument();
  });

  it('shows the selected value label', () => {
    render(<PersonSelect value="Mom" onChange={() => {}} options={options} placeholder="-- select person --" inputId="from" />);
    expect(screen.getByText('Mom')).toBeInTheDocument();
  });
});
