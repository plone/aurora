import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CopyButton from './CopyButton';

function prepareWriteText({ succeeds = true } = {}) {
  const writeText = succeeds
    ? vi.fn().mockResolvedValue(undefined)
    : vi.fn().mockThrow(new Error('Error'));
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

describe('CopyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has proper label after success', async () => {
    prepareWriteText();

    render(<CopyButton />);

    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    await vi.waitUntil(() => btn.textContent === 'cmsui.siteOverview.copied', {
      timeout: 2_000,
      interval: 500,
    });
  });

  it('has proper label after failure', async () => {
    prepareWriteText({ succeeds: false });

    render(<CopyButton />);

    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    await vi.waitUntil(
      () => btn.textContent === 'cmsui.siteOverview.copyFailed',
      {
        timeout: 2_000,
        interval: 500,
      },
    );
  });

  it('renders and works as expected with the clipboard (no props)', () => {
    const writeText = prepareWriteText();

    const { container } = render(<CopyButton />);

    expect(container.firstChild).toMatchSnapshot();

    fireEvent.click(screen.getByRole('button'));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('');
  });

  it('renders and works as expected with the clipboard (with label)', () => {
    const writeText = prepareWriteText();

    const { container } = render(<CopyButton label="Click me" />);

    expect(container.firstChild).toMatchSnapshot();

    fireEvent.click(screen.getByRole('button'));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('');
  });

  it('renders and works as expected with the clipboard (with label and handler)', () => {
    const writeText = prepareWriteText();

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
