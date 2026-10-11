import type { Brain } from '@plone/types';
import type { TextFieldProps as QuantaTextFieldProps } from '@plone/quanta';
import {
  Description,
  fieldBorderStyles,
  FieldError,
  Label,
} from '../Field/Field';
import { tv } from 'tailwind-variants';
import { focusRing } from '../utils';
import { useWidgetContext } from '../Form/WidgetContext';
import { ObjectBrowserProvider } from './ObjectBrowserContext';
import type { UseObjectBrowserConfig } from './ObjectBrowserContext';
import { ObjectBrowserTags } from './ObjectBrowserTags';
import { ObjectBrowserTrigger } from './ObjectBrowserTrigger';
import { ObjectBrowserModal } from './ObjectBrowserModal';
import { useFocusRing, useId } from 'react-aria';

type BaseFormFieldProps = Pick<
  QuantaTextFieldProps,
  'label' | 'description' | 'errorMessage' | 'placeholder'
>;

// TODO: better styling
const widgetStyles = tv({
  extend: focusRing,
  base: 'mx-1 flex items-center justify-between gap-2 rounded-md',
  variants: {
    isFocused: fieldBorderStyles.variants.isFocusWithin,
    isInvalid: fieldBorderStyles.variants.isInvalid,
    isDisabled: fieldBorderStyles.variants.isDisabled,
  },
});

interface ObjectBrowserWidgetProps
  extends BaseFormFieldProps, Partial<UseObjectBrowserConfig> {}
// TODO: interaction with plate and blocks schema
export function ObjectBrowserWidgetComponent(props: ObjectBrowserWidgetProps) {
  const { label, description, errorMessage } = props;
  const { isFocusVisible, focusProps } = useFocusRing();
  const id = useId();
  return (
    <div className="group mb-4 flex flex-col gap-1">
      {label && (
        <Label
          id={id}
          className={`
            not-group-data-invalid:not-group-data-readonly:has-[+div:focus]:text-quanta-sapphire
          `}
        >
          {label}
        </Label>
      )}
      {/* // TODO: maybe find a better way to use focus and leverage group focus styles */}
      <div
        {...focusProps}
        aria-labelledby={id}
        className={widgetStyles({
          isFocusVisible,
          isInvalid: !!props.errorMessage,
        })}
        role="group"
      >
        <ObjectBrowserTags />
        <ObjectBrowserTrigger>
          <ObjectBrowserModal />
        </ObjectBrowserTrigger>
      </div>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </div>
  );
}

export function ObjectBrowserWidget(
  props: ObjectBrowserWidgetProps & { value?: Brain[] | null },
) {
  // The browser starts from the object the form is about (or the container
  // a new object is added to), whichever route the form is in.
  const { path } = useWidgetContext();
  const { label, description, errorMessage, value, defaultValue, ...rest } =
    props;
  return (
    <ObjectBrowserProvider
      config={{
        ...rest,
        // The selection follows the field value.
        value: value ?? defaultValue ?? [],
        title: label,
        initialPath: path,
      }}
    >
      <ObjectBrowserWidgetComponent {...{ label, description, errorMessage }} />
    </ObjectBrowserProvider>
  );
}

ObjectBrowserWidget.displayName = 'ObjectBrowserWidget';
