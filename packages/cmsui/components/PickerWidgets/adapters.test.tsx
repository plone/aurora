import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AlignWidget, SizeWidget } from './PickerWidgets';
import { TextareaWidget } from '../TextareaWidget/TextareaWidget';
import { DateWidget } from '../DateWidget/DateWidget';

describe('picker widgets', () => {
  it('select the stored value and emit the chosen one', () => {
    const onChange = vi.fn();
    render(
      <SizeWidget name="size" label="Size" value="m" onChange={onChange} />,
    );

    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Large' }));
    expect(onChange).toHaveBeenCalledWith('l');
  });

  it('select the schema default without a stored value', () => {
    render(
      <AlignWidget
        name="align"
        label="Alignment"
        value={null}
        defaultValue="left"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Left' })).toBeChecked();
  });

  it('use the actions from the field schema', () => {
    render(
      <SizeWidget
        name="size"
        label="Size"
        value="s"
        onChange={vi.fn()}
        actions={['s', 'l']}
      />,
    );

    expect(screen.queryByRole('radio', { name: 'Medium' })).toBeNull();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('show the validation error', () => {
    render(
      <AlignWidget
        name="align"
        label="Alignment"
        value={null}
        onChange={vi.fn()}
        invalid
        errorMessage="Pick an alignment."
      />,
    );

    expect(screen.getByText('Pick an alignment.')).toBeInTheDocument();
  });
});

describe('TextareaWidget', () => {
  it('edits multi-line text and shows its state', () => {
    const onChange = vi.fn();
    render(
      <TextareaWidget
        name="description"
        label="Summary"
        value={null}
        onChange={onChange}
        required
        invalid
        errorMessage="Required input is missing."
      />,
    );

    const textarea = screen.getByRole('textbox', { name: /Summary/ });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveValue('');
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required input is missing.')).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });
    expect(onChange).toHaveBeenCalledWith('Line 1\nLine 2');
  });
});

describe('DateWidget', () => {
  it('shows an ISO date and its error', () => {
    render(
      <DateWidget
        name="birthday"
        label="Birthday"
        value="2026-10-09"
        onChange={vi.fn()}
        invalid
        errorMessage="Pick a date."
      />,
    );

    expect(screen.getByText('Birthday')).toBeInTheDocument();
    expect(screen.getByText('Pick a date.')).toBeInTheDocument();
    // The form value is the ISO date the content API stores.
    expect(
      document.querySelector<HTMLInputElement>('input[name="birthday"]')?.value,
    ).toBe('2026-10-09');
  });
});
