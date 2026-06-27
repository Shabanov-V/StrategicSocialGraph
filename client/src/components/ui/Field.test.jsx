// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Field from './Field';

describe('Field', () => {
  it('associates the label with the control via htmlFor', () => {
    render(
      <Field label="Sector:" htmlFor="sector">
        <input id="sector" />
      </Field>
    );
    expect(screen.getByLabelText('Sector:')).toBeInTheDocument();
  });

  it('shows an error message when provided', () => {
    render(
      <Field label="Name:" htmlFor="name" error="Required">
        <input id="name" />
      </Field>
    );
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
