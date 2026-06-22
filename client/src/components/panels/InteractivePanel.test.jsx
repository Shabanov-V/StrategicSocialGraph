// @vitest-environment jsdom
import React, { useState } from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import InteractivePanel from './InteractivePanel';

const BASE = `center: Alex
people: []
layout:
  sector_distribution:
    Work: 1
display:
  colors:
    friend: "#ffffff"
`;

// Harness holds yamlText in state so adds actually round-trip through the document.
function Harness() {
  const [yamlText, setYamlText] = useState(BASE);
  return (
    <>
      <InteractivePanel yamlText={yamlText} setYamlText={setYamlText} />
      <pre data-testid="yaml">{yamlText}</pre>
    </>
  );
}

beforeAll(() => {
  // jsdom doesn't implement scrollIntoView, which react-select touches.
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

describe('Add person flow', () => {
  it('focuses the Name field on open', async () => {
    render(<Harness />);
    await waitFor(() =>
      expect(screen.getByLabelText('Name:')).toHaveFocus()
    );
  });

  it('hides Advanced fields until toggled', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByLabelText('Strength:')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Advanced/ }));

    expect(screen.getByLabelText('Strength:')).toBeInTheDocument();
    expect(screen.getByLabelText('Direction:')).toBeInTheDocument();
    expect(screen.getByLabelText('Quality:')).toBeInTheDocument();
  });

  it('keeps sector but clears name after add, with a confirmation', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('Name:'), 'Bob');
    await user.selectOptions(screen.getByLabelText('Sector:'), 'Work');
    await user.click(screen.getByRole('button', { name: 'Add Person' }));

    // Person landed in the document.
    expect(screen.getByTestId('yaml').textContent).toContain('Bob');
    // Sticky: name cleared, sector retained.
    expect(screen.getByLabelText('Name:')).toHaveValue('');
    expect(screen.getByLabelText('Sector:')).toHaveValue('Work');
    // Inline confirmation shown.
    expect(screen.getByText('✓ Added Bob')).toBeInTheDocument();
    // Focus returns to Name for the next entry.
    expect(screen.getByLabelText('Name:')).toHaveFocus();
  });
});

const WITH_PERSON = `center: Alex
people:
  - id: 1
    name: Mom
    sector: Work
    circle: 1
    quality: negative
display:
  colors:
    friend: "#ffffff"
`;

function PersonHarness() {
  const [yamlText, setYamlText] = useState(WITH_PERSON);
  return <InteractivePanel yamlText={yamlText} setYamlText={setYamlText} />;
}

describe('Edit person flow', () => {
  it('auto-expands Advanced when the selected person has non-default values', async () => {
    const user = userEvent.setup();
    render(<PersonHarness />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    // Pick Mom from the react-select person picker.
    await user.click(screen.getByLabelText('Person:'));
    await user.keyboard('{ArrowDown}{Enter}');

    // Mom has quality: negative → Advanced opens and shows the value.
    const quality = await screen.findByLabelText('Quality:');
    expect(quality).toHaveValue('negative');
  });
});
