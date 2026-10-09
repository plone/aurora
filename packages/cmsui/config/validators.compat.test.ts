import { beforeEach, describe, expect, it } from 'vitest';
import config from '@plone/registry';
import { buildSchemaValidators } from '../components/Form/validation';

/* eslint-disable @typescript-eslint/no-unsafe-function-type -- Volto's
   validator types use `Function`, and are copied here as they are. */
// Validators written for Volto must keep type-checking against the shared
// `validator` utility type. These types are copied as they are from Volto
// (packages/volto/src/helpers/FormValidation/validators.ts). If this file
// stops compiling, the change to `ValidatorUtilityArgs` breaks Volto.
type Validator = {
  value: string;
  field: Record<string, any>;
  formData: any;
  formatMessage: Function;
};

type Choice = {
  token: string;
  label: string;
};
type ChoiceValidator = {
  value: string | Choice;
  field: Record<string, any>;
  formData: any;
  formatMessage: Function;
};

type FileValidator = {
  value: Record<string, any>;
  field: Record<string, any>;
  formData: any;
  formatMessage: Function;
};

const messages = {
  minLength: { id: 'Minimum length is {len}.', defaultMessage: 'Too short' },
};

const voltoMinLengthValidator = ({ value, field, formatMessage }: Validator) =>
  value.length < field.minLength
    ? formatMessage(messages.minLength, { len: field.minLength })
    : null;

const voltoChoiceValidator = ({ value, formatMessage }: ChoiceValidator) =>
  value ? null : formatMessage({ id: 'choice' });

const voltoFileValidator = ({ value, formatMessage }: FileValidator) =>
  value.size > 10 ? formatMessage({ id: 'size' }) : null;

beforeEach(() => {
  config.set('utilities', {});
});

describe('Volto-style validators', () => {
  it('can be registered as validator utilities', () => {
    // The type check is the test: these calls must compile.
    config.registerUtility({
      name: 'minLength',
      type: 'validator',
      dependencies: { fieldType: 'string' },
      method: voltoMinLengthValidator,
    });
    config.registerUtility({
      name: 'choice',
      type: 'validator',
      dependencies: { format: 'choice' },
      method: voltoChoiceValidator,
    });
    config.registerUtility({
      name: 'size',
      type: 'validator',
      dependencies: { fieldType: 'object' },
      method: voltoFileValidator,
    });

    expect(config.getUtilities({ type: 'validator' })).toHaveLength(3);
  });

  it('run in Plone Aurora forms, translating with formatMessage', () => {
    config.registerUtility({
      name: 'minLength',
      type: 'validator',
      dependencies: { fieldType: 'string' },
      method: voltoMinLengthValidator,
    });
    // An i18next-like `t`: unknown keys fall back to `defaultValue`.
    const t = (key: string, options?: Record<string, unknown>) =>
      (options?.defaultValue as string) ?? key;

    const validators = buildSchemaValidators(
      { properties: { title: { type: 'string', minLength: 5 } } },
      { t },
    );

    expect(validators.title('abc', {})).toEqual(['Too short']);
  });
});
