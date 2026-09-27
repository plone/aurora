import React from 'react';

import {
  CustomRadio,
  RadioGroup,
  type RadioGroupProps,
} from '../RadioGroup/RadioGroup.quanta';
import {
  AlignleftIcon,
  AligncenterIcon,
  AlignrightIcon,
  ImageIcon,
  ImagefullIcon,
} from '@plone/icons';

interface AlignWidgetProps extends Omit<RadioGroupProps, 'children'> {
  id?: string;
  actions?: string[];
  actionsInfoMap?: Record<string, [React.ComponentType<any>, string]>;
}

export const defaultActionsInfo: Record<
  string,
  [React.ComponentType<any>, string]
> = {
  left: [AlignleftIcon, 'Left'],
  right: [AlignrightIcon, 'Right'],
  center: [AligncenterIcon, 'Center'],
  narrow: [ImageIcon, 'Narrow'],
  wide: [ImageIcon, 'Wide'],
  full: [ImagefullIcon, 'Full'],
};

export function AlignWidget(props: AlignWidgetProps) {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    onChange,
    actions = ['left', 'right', 'center', 'full'],
    actionsInfoMap,
    ...radioGroupProps
  } = props;

  const actionsInfo = {
    ...defaultActionsInfo,
    ...actionsInfoMap,
  };

  const handleChange = (selectedValue: string) => {
    if (onChange) {
      onChange(selectedValue);
    }
  };

  return (
    <RadioGroup
      {...radioGroupProps}
      onChange={handleChange}
      orientation="horizontal"
    >
      {actions.map((action) => {
        const [IconComponent, label] = actionsInfo[action];
        return (
          <CustomRadio key={action} value={action}>
            <IconComponent size="base" aria-label={label} />
          </CustomRadio>
        );
      })}
    </RadioGroup>
  );
}
