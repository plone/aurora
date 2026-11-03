import type { CSSProperties, PropsWithChildren } from 'react';

import clsx from 'clsx';

type BlockInnerContainerProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
}>;

export function BlockInnerContainer({
  children,
  className,
  style,
}: BlockInnerContainerProps) {
  return (
    <div className={clsx('block-inner-container', className)} style={style}>
      {children}
    </div>
  );
}
