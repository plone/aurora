import { fireEvent, screen } from '@testing-library/react';
import { describeWidgetContract } from '../testing/widgetContract';
import { TextWidget } from '../components/TextWidget/TextWidget';
import { TextareaWidget } from '../components/TextareaWidget/TextareaWidget';
import { BooleanWidget } from '../components/BooleanWidget/BooleanWidget';
import { DateWidget } from '../components/DateWidget/DateWidget';
import { DateTimeWidget } from '../components/DateTimeWidget/DateTimeWidget';
import {
  AlignWidget,
  SizeWidget,
  WidthWidget,
} from '../components/PickerWidgets/PickerWidgets';

// Every core widget runs the contract tests.

describeWidgetContract('TextWidget', TextWidget, {
  value: 'Hello',
  change: {
    perform: () =>
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Hello world' },
      }),
    expected: 'Hello world',
  },
});

describeWidgetContract('TextareaWidget', TextareaWidget, {
  value: 'First line',
  change: {
    perform: () =>
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'First line\nSecond line' },
      }),
    expected: 'First line\nSecond line',
  },
});

describeWidgetContract('BooleanWidget', BooleanWidget, {
  value: false,
  change: {
    perform: () => fireEvent.click(screen.getByRole('checkbox')),
    expected: true,
  },
});

describeWidgetContract('DateWidget', DateWidget, { value: '2026-10-09' });

describeWidgetContract('DateTimeWidget', DateTimeWidget, {
  value: '2026-10-09T10:00:00+00:00',
});

describeWidgetContract('AlignWidget', AlignWidget, {
  value: 'left',
  change: {
    perform: () =>
      fireEvent.click(screen.getByRole('radio', { name: 'Right' })),
    expected: 'right',
  },
});

describeWidgetContract('SizeWidget', SizeWidget, {
  value: 's',
  change: {
    perform: () =>
      fireEvent.click(screen.getByRole('radio', { name: 'Large' })),
    expected: 'l',
  },
});

describeWidgetContract('WidthWidget', WidthWidget, {
  value: 'default',
  change: {
    perform: () => fireEvent.click(screen.getByRole('radio', { name: 'Full' })),
    expected: 'full',
  },
});
