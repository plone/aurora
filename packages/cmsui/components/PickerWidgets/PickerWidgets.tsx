import type { FormWidgetProps } from '@plone/types';
import {
  AlignPicker,
  SizePicker,
  WidthPicker,
  type AlignPickerProps,
  type SizePickerProps,
  type WidthPickerProps,
} from '@plone/quanta';

type PickerWidgetProps<P> = FormWidgetProps<string | null> &
  Pick<P, Extract<keyof P, 'actions' | 'actionsInfoMap'>>;

/**
 * Maps the widget contract to the props of a Quanta picker (a radio group
 * of icon options). Without a stored value, the schema default is selected.
 */
const toPickerProps = ({
  name,
  value,
  defaultValue,
  onChange,
  onBlur,
  label,
  description,
  required,
  disabled,
  readOnly,
  invalid,
  errorMessage,
  className,
}: FormWidgetProps<string | null>) => ({
  name,
  value: value ?? defaultValue ?? null,
  onChange: (next: string) => onChange(next),
  onBlur,
  label,
  description,
  isRequired: required,
  isDisabled: disabled,
  isReadOnly: readOnly,
  isInvalid: invalid,
  errorMessage,
  validationBehavior: 'aria' as const,
  className,
});

/** Adapts the widget contract to the Quanta `AlignPicker` control. */
export function AlignWidget({
  actions,
  actionsInfoMap,
  ...props
}: PickerWidgetProps<AlignPickerProps>) {
  return (
    <AlignPicker
      {...toPickerProps(props)}
      actions={actions}
      actionsInfoMap={actionsInfoMap}
    />
  );
}
AlignWidget.displayName = 'AlignWidget';

/** Adapts the widget contract to the Quanta `SizePicker` control. */
export function SizeWidget({
  actions,
  actionsInfoMap,
  ...props
}: PickerWidgetProps<SizePickerProps>) {
  return (
    <SizePicker
      {...toPickerProps(props)}
      actions={actions}
      actionsInfoMap={actionsInfoMap}
    />
  );
}
SizeWidget.displayName = 'SizeWidget';

/** Adapts the widget contract to the Quanta `WidthPicker` control. */
export function WidthWidget({
  actions,
  actionsInfoMap,
  ...props
}: PickerWidgetProps<WidthPickerProps>) {
  return (
    <WidthPicker
      {...toPickerProps(props)}
      actions={actions}
      actionsInfoMap={actionsInfoMap}
    />
  );
}
WidthWidget.displayName = 'WidthWidget';
