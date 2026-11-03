import { describe, expect, test } from 'vitest';
import { createContentDataSchema, updateContentDataSchema } from './content';
import { createUserDataSchema, updateUserDataSchema } from './users';

describe('content data schemas', () => {
  test('createContentDataSchema keeps unknown (custom dexterity) fields', () => {
    const parsed = createContentDataSchema.parse({
      '@type': 'Document',
      title: 'My Page',
      my_custom_field: 'custom value',
    });

    expect(parsed.my_custom_field).toBe('custom value');
  });

  test('updateContentDataSchema keeps unknown (custom dexterity) fields', () => {
    const parsed = updateContentDataSchema.parse({
      title: 'My Page',
      my_custom_field: 'custom value',
    });

    expect(parsed.my_custom_field).toBe('custom value');
  });

  test('updateContentDataSchema still rejects mistyped declared fields', () => {
    expect(() =>
      updateContentDataSchema.parse({ exclude_from_nav: 'yes' }),
    ).toThrow();
  });

  test('updateContentDataSchema accepts a new or a stored image', () => {
    const upload = {
      'content-type': 'image/png',
      data: 'ZmFrZQ==',
      encoding: 'base64',
      filename: 'photo.png',
    };
    const stored = {
      'content-type': 'image/png',
      download: 'http://localhost:8080/Plone/photo/@@images/image',
      filename: 'photo.png',
      size: 4,
    };

    expect(updateContentDataSchema.parse({ image: upload }).image).toEqual(
      upload,
    );
    expect(updateContentDataSchema.parse({ image: stored }).image).toEqual(
      stored,
    );
    expect(() =>
      updateContentDataSchema.parse({ file: { filename: 'a.pdf' } }),
    ).toThrow();
  });
});

describe('user data schemas', () => {
  test('createUserDataSchema keeps custom member properties', () => {
    const parsed = createUserDataSchema.parse({
      email: 'jane@example.com',
      username: 'jane',
      phone: '+1 555 0100',
    });

    expect(parsed.phone).toBe('+1 555 0100');
  });

  test('updateUserDataSchema keeps custom member properties', () => {
    const parsed = updateUserDataSchema.parse({
      fullname: 'Jane Doe',
      department: 'Engineering',
    });

    expect(parsed.department).toBe('Engineering');
  });

  test('updateUserDataSchema still rejects mistyped declared fields', () => {
    expect(() =>
      updateUserDataSchema.parse({ email: 'not-an-email' }),
    ).toThrow();
  });
});
