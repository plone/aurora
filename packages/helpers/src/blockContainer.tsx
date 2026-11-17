import { createContext, useContext } from 'react';

/**
 * Where a block is rendered: the container it sits in, such as a grid
 * column. Containers provide it in the editor and in the published view.
 */
export type BlockContainerInfo = {
  /** The container's type, such as `grid`. */
  type: string;
  /** The container's data, such as the grid's `gap` or `theme`. */
  data: Record<string, unknown>;
  /** The position of the block's slot in the container, from 0. */
  index: number;
  /** The number of slots in the container, such as its columns. */
  count: number;
  /** The slot's width weight, for containers whose slots have one. */
  size?: number;
  /** The sum of the slots' width weights. */
  totalSize?: number;
};

const BlockContainerContext = createContext<BlockContainerInfo | null>(null);

/** Provides the container that the blocks inside it are rendered in. */
export const BlockContainerProvider = BlockContainerContext.Provider;

/**
 * The container a block is rendered in, such as a grid column, or `null`
 * outside one. A block uses it to adapt to where it sits.
 */
export const useBlockContainer = () => useContext(BlockContainerContext);

/**
 * The share of the width a block gets in its container, from 0 to 1, or
 * `undefined` when the container doesn't size its slots.
 */
export const getBlockContainerShare = (
  container: BlockContainerInfo | null | undefined,
) =>
  container?.size && container.totalSize
    ? container.size / container.totalSize
    : undefined;
