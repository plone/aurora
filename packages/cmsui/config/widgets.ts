import type { ConfigType } from '@plone/registry';
import { RecurrenceWidget } from '../components/RecurrenceWidget/RecurrenceWidget';
import { ObjectBrowserWidget } from '../components/ObjectBrowserWidget/ObjectBrowserWidget';
import ImageWidget from '../components/ImageWidget/ImageWidget';
import { BooleanWidget } from '../components/BooleanWidget/BooleanWidget';
import { TextWidget } from '../components/TextWidget/TextWidget';
import { TextareaWidget } from '../components/TextareaWidget/TextareaWidget';
import { DateWidget } from '../components/DateWidget/DateWidget';
import {
  AlignWidget,
  SizeWidget,
  WidthWidget,
} from '../components/PickerWidgets/PickerWidgets';
import { DateTimeWidget } from '../components/DateTimeWidget/DateTimeWidget';
import { QuerystringWidget } from '../components/QuerystringWidget/QuerystringWidget';
import { SelectWidget } from '../components/SelectWidget/SelectWidget';
import { ArrayWidget } from '../components/ArrayWidget/ArrayWidget';
import { NumberWidget } from '../components/NumberWidget/NumberWidget';
import { FileWidget } from '../components/FileWidget/FileWidget';
import {
  EmailWidget,
  PasswordWidget,
  UrlWidget,
} from '../components/InputWidgets/InputWidgets';

export default function install(config: ConfigType) {
  config.registerDefaultWidget(TextWidget);
  // Fields with choices or a vocabulary, without a more specific widget.
  config.registerChoicesWidget(SelectWidget);

  config.registerWidget({
    key: 'id',
    definition: { recurrence: RecurrenceWidget },
  });
  config.registerWidget({ key: 'widget', definition: { date: DateWidget } });
  config.registerWidget({
    key: 'widget',
    definition: { textarea: TextareaWidget },
  });
  config.registerWidget({
    key: 'widget',
    definition: { datetime: DateTimeWidget },
  });
  config.registerWidget({
    key: 'type',
    definition: {
      boolean: BooleanWidget,
      array: ArrayWidget,
      number: NumberWidget,
      integer: NumberWidget,
    },
  });
  config.registerWidget({
    key: 'widget',
    definition: {
      select: SelectWidget,
      array: ArrayWidget,
      token: ArrayWidget,
      file: FileWidget,
      email: EmailWidget,
      password: PasswordWidget,
      url: UrlWidget,
    },
  });
  config.registerWidget({
    key: 'widget',
    definition: { align: AlignWidget },
  });
  config.registerWidget({
    key: 'widget',
    definition: { size: SizeWidget },
  });
  config.registerWidget({
    key: 'widget',
    definition: { width: WidthWidget },
  });
  config.registerWidget({
    key: 'widget',
    definition: { image: ImageWidget },
  });
  config.registerWidget({
    key: 'factory',
    definition: {
      'Relation List': ObjectBrowserWidget,
      // File and image fields store the file itself, such as the file of a
      // File, the image of an Image, or a lead image. The `image` widget
      // is for fields that store the URL of an image.
      File: FileWidget,
      Image: FileWidget,
    },
  });
  config.registerWidget({
    key: 'widget',
    definition: {
      object_browser: ObjectBrowserWidget,
    },
  });
  config.registerWidget({
    key: 'widget',
    definition: {
      querystring: QuerystringWidget,
    },
  });
  config.registerWidget({
    key: 'vocabulary',
    definition: {
      'plone.app.vocabularies.Catalog': ObjectBrowserWidget,
    },
  });

  return config;
}
