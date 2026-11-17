import React from 'react';
import {
  ProgressBar as RACProgressBar,
  type ProgressBarProps as RACProgressBarProps,
} from 'react-aria-components';
import { composeTailwindRenderProps } from '../../utils';
import { Label } from '../Field/Field';

export interface ProgressBarProps extends RACProgressBarProps {
  label?: string;
  /** Hides the value text, e.g. "40%", next to the label. */
  hideValue?: boolean;
}

/** Shows the progress of a long task, such as a workflow change. */
export function ProgressBar({ label, hideValue, ...props }: ProgressBarProps) {
  return (
    <RACProgressBar
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'flex w-full flex-col gap-1',
      )}
    >
      {({ percentage, valueText, isIndeterminate }) => (
        <>
          {(label || !hideValue) && (
            <div className="flex justify-between gap-2">
              {label && <Label>{label}</Label>}
              {!hideValue && !isIndeterminate && (
                <span className="text-xs text-quanta-pigeon tabular-nums">
                  {valueText}
                </span>
              )}
            </div>
          )}
          <div
            className={`
              relative h-2 w-full overflow-hidden rounded-full bg-quanta-smoke outline
              -outline-offset-1 outline-transparent
            `}
          >
            <div
              className={`
                absolute top-0 h-full rounded-full bg-quanta-sapphire
                forced-colors:bg-[Highlight]
                ${
                  isIndeterminate
                    ? `
                      left-0 w-full animate-pulse opacity-60
                      motion-reduce:animate-none
                    `
                    : 'left-0 transition-[width] duration-200'
                }
              `}
              style={isIndeterminate ? undefined : { width: `${percentage}%` }}
            />
          </div>
        </>
      )}
    </RACProgressBar>
  );
}
