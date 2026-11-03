import { describe, expect, it } from 'vitest';
import { createPlateEditor } from 'platejs/react';

import {
  I18nPlugin,
  fallbackTranslate,
  getTranslation,
  translationFromIntl,
  type TranslateFunction,
} from './i18n';
import { getDefaultSlashMenuGroups } from './slash-menu';

const upper: TranslateFunction = (key, options) =>
  (options?.defaultValue ?? key).toUpperCase();

describe('i18n plugin', () => {
  it('falls back to the default value and fills placeholders', () => {
    expect(
      fallbackTranslate('x', {
        defaultValue: 'Hello {{name}}, {{ missing }}',
        name: 'Plone',
      }),
    ).toBe('Hello Plone, {{ missing }}');
  });

  it('falls back to the key without a default value', () => {
    expect(fallbackTranslate('plate.x')).toBe('plate.x');
  });

  it('adapts a react-intl like object', () => {
    const calls: unknown[] = [];
    const { t, language } = translationFromIntl({
      locale: 'de',
      formatMessage: (message, values) => {
        calls.push([message, values]);
        return 'ok';
      },
    });

    expect(t('a.b', { defaultValue: 'Hi {{ name }}', name: 'Plone' })).toBe(
      'ok',
    );
    expect(calls).toEqual([
      [{ id: 'a.b', defaultMessage: 'Hi {name}' }, { name: 'Plone' }],
    ]);
    expect(language).toBe('de');
  });

  it('resolves the current translation from the editor', () => {
    const editor = createPlateEditor({ plugins: [I18nPlugin] });
    const options = { defaultValue: 'Text' };

    expect(getTranslation(editor).t('x', options)).toBe('Text');
    expect(getTranslation(editor).i18n.language).toBe('en');

    editor.setOption(I18nPlugin, 't', upper);
    editor.setOption(I18nPlugin, 'language', 'it');

    expect(getTranslation(editor).t('x', options)).toBe('TEXT');
    expect(getTranslation(editor).i18n.language).toBe('it');
  });

  it('uses the defaults when the plugin is missing', () => {
    const { t, i18n } = getTranslation(createPlateEditor());

    expect(t('x', { defaultValue: 'Text' })).toBe('Text');
    expect(i18n.language).toBe('en');
  });

  it('translates the default slash menu labels', () => {
    const editor = createPlateEditor();
    const groups = getDefaultSlashMenuGroups(editor, {
      hasTitleBlock: false,
      t: upper,
    });
    const textBlocks = groups.find((group) => group.group === 'Text blocks');

    expect(textBlocks?.label).toBe('TEXT BLOCKS');
    expect(textBlocks?.items.map((item) => item.label)).toContain('HEADING 2');
    expect(textBlocks?.items.map((item) => item.label)).toContain('TITLE');
  });
});
