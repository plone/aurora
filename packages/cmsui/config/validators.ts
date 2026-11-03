import type { ConfigType } from '@plone/registry';
import type { ValidatorUtility } from '@plone/types';

// The built-in field validators, ported from Volto. Each one is registered
// as a `validator` utility and runs on the fields its dependencies match.
// Validators only run on non-empty values; the form checks required fields.

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const minLengthValidator: ValidatorUtility = ({ value, field, t }) =>
  field.minLength !== undefined && String(value).length < field.minLength
    ? t('cmsui.validation.minLength', { len: field.minLength })
    : null;

export const maxLengthValidator: ValidatorUtility = ({ value, field, t }) =>
  field.maxLength !== undefined && String(value).length > field.maxLength
    ? t('cmsui.validation.maxLength', { len: field.maxLength })
    : null;

export const patternValidator: ValidatorUtility = ({ value, field, t }) =>
  field.pattern && !new RegExp(field.pattern).test(String(value))
    ? t('cmsui.validation.pattern', { pattern: field.pattern })
    : null;

// The email address syntax of the WHATWG HTML standard:
// https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type=email)
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const emailValidator: ValidatorUtility = ({ value, t }) =>
  EMAIL.test(String(value)) ? null : t('cmsui.validation.email');

const URL_PATTERN = new RegExp(
  '^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3})|' + // or IPv4 address
    'localhost)' + // or localhost
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', // fragment
  'i',
);

export const urlValidator: ValidatorUtility = ({ value, t }) =>
  URL_PATTERN.test(String(value)) ? null : t('cmsui.validation.url');

export const numberValidator: ValidatorUtility = ({ value, t }) =>
  /^[+-]?\d+(\.\d+)?$/.test(String(value)) && Number.isFinite(Number(value))
    ? null
    : t('cmsui.validation.number');

export const integerValidator: ValidatorUtility = ({ value, t }) =>
  /^[+-]?\d+$/.test(String(value)) ? null : t('cmsui.validation.integer');

export const minimumValidator: ValidatorUtility = ({ value, field, t }) =>
  field.minimum !== undefined && Number(value) < field.minimum
    ? t('cmsui.validation.minimum', { len: field.minimum })
    : null;

export const maximumValidator: ValidatorUtility = ({ value, field, t }) =>
  field.maximum !== undefined && Number(value) > field.maximum
    ? t('cmsui.validation.maximum', { len: field.maximum })
    : null;

export const minItemsValidator: ValidatorUtility = ({ value, field, t }) =>
  field.minItems && Array.isArray(value) && value.length < field.minItems
    ? t('cmsui.validation.minItems', { minItems: field.minItems })
    : null;

export const maxItemsValidator: ValidatorUtility = ({ value, field, t }) =>
  field.maxItems && Array.isArray(value) && value.length > field.maxItems
    ? t('cmsui.validation.maxItems', { maxItems: field.maxItems })
    : null;

export const uniqueItemsValidator: ValidatorUtility = ({ value, field, t }) =>
  field.uniqueItems &&
  Array.isArray(value) &&
  new Set(value.map((item) => JSON.stringify(item))).size !== value.length
    ? t('cmsui.validation.uniqueItems')
    : null;

export const startEventDateRangeValidator: ValidatorUtility = ({
  value,
  formData,
  t,
}) =>
  formData?.end && new Date(value) > new Date(formData.end)
    ? t('cmsui.validation.startEventRange', { end: formatDate(formData.end) })
    : null;

export const endEventDateRangeValidator: ValidatorUtility = ({
  value,
  formData,
  t,
}) =>
  formData?.start && new Date(value) < new Date(formData.start)
    ? t('cmsui.validation.endEventRange', {
        start: formatDate(formData.start),
      })
    : null;

export const defaultLanguageValidator: ValidatorUtility = ({
  value,
  formData,
  t,
}) => {
  const token = typeof value === 'object' ? value?.token : value;
  const available: Array<string | { token: string }> =
    formData?.available_languages ?? [];
  const isAvailable = available.some(
    (language) =>
      (typeof language === 'object' ? language.token : language) === token,
  );
  return isAvailable ? null : t('cmsui.validation.defaultLanguage');
};

export default function install(config: ConfigType) {
  const register = (
    name: string,
    dependencies: Record<string, string>,
    method: ValidatorUtility,
  ) =>
    config.registerUtility({ name, type: 'validator', dependencies, method });

  for (const fieldType of ['string', 'password']) {
    register('minLength', { fieldType }, minLengthValidator);
    register('maxLength', { fieldType }, maxLengthValidator);
    register('pattern', { fieldType }, patternValidator);
  }
  register('email', { widget: 'email' }, emailValidator);
  register('url', { widget: 'url' }, urlValidator);

  register('number', { fieldType: 'number' }, numberValidator);
  register('integer', { fieldType: 'integer' }, integerValidator);
  for (const fieldType of ['number', 'integer']) {
    register('minimum', { fieldType }, minimumValidator);
    register('maximum', { fieldType }, maximumValidator);
  }

  register('minItems', { fieldType: 'array' }, minItemsValidator);
  register('maxItems', { fieldType: 'array' }, maxItemsValidator);
  register('uniqueItems', { fieldType: 'array' }, uniqueItemsValidator);

  register(
    'dateRange',
    { behaviorName: 'plone.eventbasic', fieldName: 'start' },
    startEventDateRangeValidator,
  );
  register(
    'dateRange',
    { behaviorName: 'plone.eventbasic', fieldName: 'end' },
    endEventDateRangeValidator,
  );

  register(
    'default_language',
    { format: 'default_language' },
    defaultLanguageValidator,
  );

  return config;
}
