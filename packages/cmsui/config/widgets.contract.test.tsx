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
import { SelectWidget } from '../components/SelectWidget/SelectWidget';
import { ArrayWidget } from '../components/ArrayWidget/ArrayWidget';
import { NumberWidget } from '../components/NumberWidget/NumberWidget';
import { FileWidget } from '../components/FileWidget/FileWidget';
import {
  EmailWidget,
  PasswordWidget,
  UrlWidget,
} from '../components/InputWidgets/InputWidgets';

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

describeWidgetContract('SelectWidget', SelectWidget, {
  value: 'en',
  props: {
    choices: [
      ['en', 'English'],
      ['de', 'Deutsch'],
    ],
  },
  skip: {
    required:
      "React Aria's Select marks a required field with `data-required` and its label, not with `aria-required`, which a button can't have.",
  },
  change: {
    perform: async () => {
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(await screen.findByRole('option', { name: 'Deutsch' }));
    },
    expected: 'de',
  },
});

describeWidgetContract('ArrayWidget', ArrayWidget, {
  value: ['news'],
  change: {
    perform: () => {
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'events' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    },
    expected: ['news', 'events'],
  },
});

describeWidgetContract('NumberWidget', NumberWidget, {
  value: 10,
  props: { schema: { type: 'integer' } },
  change: {
    perform: () => {
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '25' } });
      // The number field reports the number when the editor leaves it.
      fireEvent.blur(input);
    },
    expected: 25,
  },
});

describeWidgetContract('FileWidget', FileWidget, {
  value: {
    filename: 'report.pdf',
    'content-type': 'application/pdf',
    size: 1024,
    download: '/report.pdf/@@download/file',
  },
  change: {
    perform: async (container) => {
      const input = container.querySelector('input[type="file"]');
      fireEvent.change(input as HTMLInputElement, {
        target: {
          files: [new File(['hello'], 'hello.txt', { type: 'text/plain' })],
        },
      });
      // The widget reads the file before it reports it.
      await new Promise((resolve) => setTimeout(resolve, 50));
    },
    expected: {
      data: 'aGVsbG8=',
      encoding: 'base64',
      'content-type': 'text/plain',
      filename: 'hello.txt',
      size: 5,
    },
  },
});

describeWidgetContract('EmailWidget', EmailWidget, {
  value: 'editor@example.com',
  change: {
    perform: () =>
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'chief@example.com' },
      }),
    expected: 'chief@example.com',
  },
});

describeWidgetContract('PasswordWidget', PasswordWidget, {
  value: 'secret',
  change: {
    perform: (container) =>
      fireEvent.change(
        container.querySelector('input[type="password"]') as HTMLElement,
        { target: { value: 'secret2' } },
      ),
    expected: 'secret2',
  },
});

describeWidgetContract('UrlWidget', UrlWidget, {
  value: 'https://plone.org',
  change: {
    perform: () =>
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'https://plone.org/news' },
      }),
    expected: 'https://plone.org/news',
  },
});
