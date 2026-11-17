import { describe, expect, it } from 'vitest';
import {
  emailValidator,
  endEventDateRangeValidator,
  integerValidator,
  maxLengthValidator,
  minimumValidator,
  minLengthValidator,
  numberValidator,
  patternValidator,
  startEventDateRangeValidator,
  uniqueItemsValidator,
  urlValidator,
} from './validators';

const t = (key: string) => key;
const run = (validator: any, value: unknown, field = {}, formData = {}) =>
  validator({ value, field, fieldName: 'field', formData, t });

describe('built-in validators', () => {
  it('check string lengths and patterns', () => {
    expect(run(minLengthValidator, 'ab', { minLength: 3 })).toBe(
      'cmsui.validation.minLength',
    );
    expect(run(minLengthValidator, 'abc', { minLength: 3 })).toBeNull();
    expect(run(maxLengthValidator, 'abcd', { maxLength: 3 })).toBe(
      'cmsui.validation.maxLength',
    );
    expect(run(patternValidator, 'abc', { pattern: '^\\d+$' })).toBe(
      'cmsui.validation.pattern',
    );
    expect(run(patternValidator, '123', { pattern: '^\\d+$' })).toBeNull();
  });

  it('check emails and URLs', () => {
    expect(run(emailValidator, 'someone@example.com')).toBeNull();
    expect(run(emailValidator, 'someone')).toBe('cmsui.validation.email');
    expect(run(urlValidator, 'https://plone.org/news')).toBeNull();
    expect(run(urlValidator, 'not a url')).toBe('cmsui.validation.url');
  });

  it('check numbers', () => {
    expect(run(numberValidator, '3.5')).toBeNull();
    expect(run(numberValidator, 'three')).toBe('cmsui.validation.number');
    expect(run(integerValidator, '3')).toBeNull();
    expect(run(integerValidator, '3.5')).toBe('cmsui.validation.integer');
    expect(run(minimumValidator, 2, { minimum: 3 })).toBe(
      'cmsui.validation.minimum',
    );
  });

  it('check unique items', () => {
    expect(run(uniqueItemsValidator, ['a', 'a'], { uniqueItems: true })).toBe(
      'cmsui.validation.uniqueItems',
    );
    expect(
      run(uniqueItemsValidator, ['a', 'b'], { uniqueItems: true }),
    ).toBeNull();
  });

  it('check that an event ends on or after it starts', () => {
    const formData = {
      start: '2026-10-05T10:00:00+00:00',
      end: '2026-10-05T09:00:00+00:00',
    };
    expect(
      run(startEventDateRangeValidator, formData.start, {}, formData),
    ).toBe('cmsui.validation.startEventRange');
    expect(run(endEventDateRangeValidator, formData.end, {}, formData)).toBe(
      'cmsui.validation.endEventRange',
    );

    const sameTime = { start: formData.start, end: formData.start };
    expect(
      run(endEventDateRangeValidator, sameTime.end, {}, sameTime),
    ).toBeNull();
  });
});
