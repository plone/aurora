import type { ConfigType } from '@plone/registry';
import {
  AlignWidget,
  DateTimePicker,
  SizeWidget,
  WidthWidget,
  TextField,
} from '@plone/quanta';
import { DateField } from '@plone/components';
import { RecurrenceWidget } from '../components/RecurrenceWidget/RecurrenceWidget';
import { ObjectBrowserWidget } from '../components/ObjectBrowserWidget/ObjectBrowserWidget';
import ImageWidget from '../components/ImageWidget/ImageWidget';
import { BooleanWidget } from '../components/BooleanWidget/BooleanWidget';
import { QuerystringWidget } from '../components/QuerystringWidget/QuerystringWidget';

export default function install(config: ConfigType) {
  config.registerDefaultWidget(TextField);

  config.registerWidget({
    key: 'id',
    definition: { recurrence: RecurrenceWidget },
  });
  config.registerWidget({ key: 'widget', definition: { date: DateField } });
  config.registerWidget({
    key: 'widget',
    definition: { datetime: DateTimePicker },
  });
  config.registerWidget({
    key: 'type',
    definition: { boolean: BooleanWidget },
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
      // Image fields (e.g. the lead image) used to match the `image` widget
      // only because the lookup ignored categories.
      Image: ImageWidget,
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
