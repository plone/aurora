import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import config from '@plone/registry';
import Icon from './Icon';

describe('Icon', () => {
  afterEach(() => {
    config.icons = {};
  });

  it('renders a registered icon by name', () => {
    const RegisteredIcon = () => (
      <svg role="img" aria-label="registered-icon" />
    );

    config.registerIcon('registered', RegisteredIcon);

    render(<Icon name="registered" />);

    expect(
      screen.getByRole('img', { name: 'registered-icon' }),
    ).toBeInTheDocument();
  });

  it('does not render when the icon is missing', () => {
    const { container } = render(<Icon name="missing" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the exact registered component, not a fallback', () => {
    const CustomIcon = () => <svg data-testid="custom-icon" />;

    config.registerIcon('custom', CustomIcon);

    render(<Icon name="custom" />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
