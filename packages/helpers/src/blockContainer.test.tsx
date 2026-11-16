import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  BlockContainerProvider,
  getBlockContainerShare,
  useBlockContainer,
  type BlockContainerInfo,
} from './blockContainer';

function Probe() {
  const container = useBlockContainer();
  return (
    <span>{container ? `${container.type} ${container.index}` : 'none'}</span>
  );
}

const column: BlockContainerInfo = {
  type: 'grid',
  data: { gap: 'm' },
  index: 1,
  count: 3,
  size: 2,
  totalSize: 4,
};

describe('useBlockContainer', () => {
  it('returns null outside a container', () => {
    render(<Probe />);
    expect(screen.getByText('none')).toBeTruthy();
  });

  it('returns the container a block is rendered in', () => {
    render(
      <BlockContainerProvider value={column}>
        <Probe />
      </BlockContainerProvider>,
    );
    expect(screen.getByText('grid 1')).toBeTruthy();
  });
});

describe('getBlockContainerShare', () => {
  it('is the slot weight over the total', () => {
    expect(getBlockContainerShare(column)).toBe(0.5);
  });

  it('is undefined without sizes or outside a container', () => {
    expect(getBlockContainerShare({ ...column, size: undefined })).toBe(
      undefined,
    );
    expect(getBlockContainerShare(null)).toBe(undefined);
  });
});
