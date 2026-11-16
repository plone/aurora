import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CopyButton from './CopyButton';

describe('CopyButton', async () => {
  let writeText: () => void;

  beforeAll(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and works as expected with the clipboard (no props)', async () => {
    const { container } = render(<CopyButton />);

    expect(container.firstChild).toMatchSnapshot();

    fireEvent.click(screen.getByRole('button'));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('');
  });

  it('renders and works as expected with the clipboard (with label)', async () => {
    const { container } = render(<CopyButton label="Click me" />);

    expect(container.firstChild).toMatchSnapshot();

    fireEvent.click(screen.getByRole('button'));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('');
  });

  it('renders and works as expected with the clipboard (with label and handler)', async () => {
    const { container } = render(
      <CopyButton
        label="Click me"
        onCopyRequested={() => {
          return 'Well done';
        }}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();

    fireEvent.click(screen.getByRole('button'));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('Well done');
  });
});
