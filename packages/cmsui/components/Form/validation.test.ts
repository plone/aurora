import { beforeEach, describe, expect, it } from 'vitest';
import config from '@plone/registry';
import {
  buildSchemaValidators,
  firstInvalidField,
  getServerValidationErrors,
  isEmptyValue,
  parseServerValidationErrors,
} from './validation';

// Returns the key and its options, so tests can check which message is used.
const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key} ${JSON.stringify(options)}` : key;

const register = (dependencies: Record<string, string>, message: string) =>
  config.registerUtility({
    name: message,
    type: 'validator',
    dependencies,
    method: ({ value }) => (value === 'bad' ? message : null),
  });

beforeEach(() => {
  config.set('utilities', {});
});

describe('isEmptyValue', () => {
  it('treats missing, blank and empty list values as empty', () => {
    expect(isEmptyValue({}, undefined)).toBe(true);
    expect(isEmptyValue({}, null)).toBe(true);
    expect(isEmptyValue({}, '')).toBe(true);
    expect(isEmptyValue({}, [])).toBe(true);
    expect(isEmptyValue({}, 0)).toBe(false);
    expect(isEmptyValue({}, false)).toBe(false);
  });

  it('treats rich text without text as empty', () => {
    const field = { widget: 'richtext' };
    expect(isEmptyValue(field, { data: '<p> </p>' })).toBe(true);
    expect(isEmptyValue(field, { data: '<p>Text</p>' })).toBe(false);
  });
});

describe('buildSchemaValidators', () => {
  it('requires required fields, except booleans and read-only fields', () => {
    const validators = buildSchemaValidators(
      {
        properties: {
          title: { type: 'string' },
          flag: { type: 'boolean' },
          locked: { type: 'string', readonly: true },
          optional: { type: 'string' },
        },
        required: ['title', 'flag', 'locked'],
      },
      { t },
    );

    expect(validators.title('', {})).toBe('cmsui.validation.required');
    expect(validators.flag(undefined, {})).toBeUndefined();
    expect(validators.locked('', {})).toBeUndefined();
    expect(validators.optional('', {})).toBeUndefined();
  });

  it('runs the validators registered for the field', () => {
    register({ fieldType: 'string' }, 'by type');
    register({ widget: 'email' }, 'by widget');
    register({ format: 'special' }, 'by format');
    register(
      { behaviorName: 'plone.eventbasic', fieldName: 'start' },
      'by behavior',
    );
    register({ blockType: 'teaser', fieldName: 'href' }, 'by block');

    const validators = buildSchemaValidators(
      {
        properties: {
          email: { type: 'string', widget: 'email', format: 'special' },
          start: { type: 'string', behavior: 'plone.eventbasic' },
          href: { type: 'string' },
        },
      },
      { t, blockType: 'teaser' },
    );

    expect(validators.email('bad', {})).toEqual([
      'by format',
      'by type',
      'by widget',
    ]);
    expect(validators.start('bad', {})).toEqual(['by type', 'by behavior']);
    expect(validators.href('bad', {})).toEqual(['by type', 'by block']);
    expect(validators.email('good', {})).toEqual([]);
  });

  it('does not run validators on empty values', () => {
    register({ fieldType: 'string' }, 'never');
    const validators = buildSchemaValidators(
      { properties: { title: { type: 'string' } } },
      { t },
    );
    expect(validators.title('', {})).toBeUndefined();
  });

  it('passes the field, its name and all the values to validators', () => {
    let received: any;
    config.registerUtility({
      name: 'spy',
      type: 'validator',
      dependencies: { fieldType: 'string' },
      method: (args) => {
        received = args;
        return null;
      },
    });
    const validators = buildSchemaValidators(
      {
        properties: {
          title: {
            type: 'string',
            widgetOptions: { frontendOptions: { widgetProps: { max: 3 } } },
          },
        },
      },
      { t },
    );

    validators.title('Hello', { title: 'Hello', other: 1 });

    expect(received).toMatchObject({
      value: 'Hello',
      fieldName: 'title',
      formData: { title: 'Hello', other: 1 },
      field: { type: 'string', max: 3 },
    });
    expect(received.t).toBe(t);
  });
});

describe('parseServerValidationErrors', () => {
  it('maps the field errors of a plone.restapi BadRequest', () => {
    // As plone.restapi returns them: a Python repr, not JSON.
    const message =
      "[{'message': 'Invalid date: not-a-date', 'field': 'effective', 'error': 'ValidationError'}, {'field': 'title', 'message': 'title is a required field. Setting it to null is not allowed.', 'error': 'ValidationError'}]";

    expect(parseServerValidationErrors(message)).toEqual({
      effective: ['Invalid date: not-a-date'],
      title: ['title is a required field. Setting it to null is not allowed.'],
    });
  });

  it('reads messages quoted with double quotes', () => {
    const message = `[{'field': 'title', 'message': "Can't be empty", 'error': 'ValidationError'}]`;
    expect(parseServerValidationErrors(message)).toEqual({
      title: ["Can't be empty"],
    });
  });

  it('collects several errors of the same field', () => {
    const message =
      "[{'field': 'title', 'message': 'One'}, {'field': 'title', 'message': 'Two'}]";
    expect(parseServerValidationErrors(message)).toEqual({
      title: ['One', 'Two'],
    });
  });

  it('returns no errors for other messages', () => {
    expect(parseServerValidationErrors('Something went wrong')).toEqual({});
    expect(parseServerValidationErrors(undefined)).toEqual({});
  });
});

describe('getServerValidationErrors', () => {
  it('returns the field errors of a validation failure only', () => {
    const data = { message: "[{'field': 'title', 'message': 'Required'}]" };
    expect(getServerValidationErrors({ status: 400, data })).toEqual({
      title: ['Required'],
    });
    expect(getServerValidationErrors({ status: 500, data })).toBeUndefined();
    expect(
      getServerValidationErrors({ status: 400, data: { message: 'Bad' } }),
    ).toBeUndefined();
  });
});

describe('firstInvalidField', () => {
  it('follows the order of the fieldsets', () => {
    const schema = {
      fieldsets: [
        { fields: ['title', 'description'] },
        { fields: ['effective'] },
      ],
    };
    expect(firstInvalidField(schema, { effective: [], description: [] })).toBe(
      'description',
    );
  });
});
