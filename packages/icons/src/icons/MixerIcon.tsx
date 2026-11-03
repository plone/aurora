import React from 'react';
import { Icon } from '../Icon/Icon';
import type { IconPropsWithoutChildren } from '../Icon/Icon';

export const MixerIcon = (props: IconPropsWithoutChildren) => {
  return (
    <Icon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path d="M2 4H5V6H2V4ZM11 4H22V6H11V4ZM2 11H13V13H2V11ZM19 11H22V13H19V11ZM2 18H7V20H2V18ZM13 18H22V20H13V18Z" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM8 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM16 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM16 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 15.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM10 17.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"
        />
      </svg>
    </Icon>
  );
};
