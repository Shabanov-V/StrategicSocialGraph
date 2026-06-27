// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import NodePanel from './NodePanel';

const baseProps = {
  notes: [],
  noteInput: '',
  onNoteInputChange: () => {},
  onAddNote: () => {},
  onRemoveNote: () => {},
  onClose: () => {},
  onEditPerson: () => {},
};

describe('NodePanel', () => {
  it('shows the recall phrase when the person has one', () => {
    render(
      <NodePanel
        node={{ id: 3, name: 'Sarah', recall: "Tom's sister" }}
        recall="Tom's sister"
        {...baseProps}
      />
    );
    expect(screen.getByText("Tom's sister")).toBeInTheDocument();
  });

  it('renders no recall text when there is no recall', () => {
    render(
      <NodePanel node={{ id: 3, name: 'Sarah' }} recall={undefined} {...baseProps} />
    );
    expect(screen.queryByText("Tom's sister")).not.toBeInTheDocument();
  });

  it('no longer shows sector / circle / importance meta', () => {
    render(
      <NodePanel
        node={{ id: 3, name: 'Sarah', sector: 'Work', circle: 2, importance: 'high' }}
        recall={undefined}
        {...baseProps}
      />
    );
    expect(screen.queryByText(/Сектор/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Круг/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Важность/)).not.toBeInTheDocument();
  });

  it('fires onEditPerson with the node id when Edit is clicked', async () => {
    const user = userEvent.setup();
    const onEditPerson = vi.fn();
    render(
      <NodePanel
        node={{ id: 3, name: 'Sarah' }}
        recall={undefined}
        {...baseProps}
        onEditPerson={onEditPerson}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEditPerson).toHaveBeenCalledWith(3);
  });
});
