import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Icon } from './Icon';
import { AddIcon } from '../icons';

describe('Icon', () => {
  it('is hidden from assistive technology when it has no label', () => {
    const { container } = render(
      <Icon>
        <svg />
      </Icon>,
    );
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('role', 'img');
  });

  it('is exposed to assistive technology when it has a label', () => {
    const { container } = render(
      <Icon aria-label="Add">
        <svg />
      </Icon>,
    );
    const svg = container.querySelector('svg');

    expect(svg).not.toHaveAttribute('aria-hidden');
    expect(svg).toHaveAttribute('aria-label', 'Add');
  });

  it('renders a generated icon as an svg', () => {
    const { container } = render(<AddIcon />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<AddIcon aria-label="Add" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
