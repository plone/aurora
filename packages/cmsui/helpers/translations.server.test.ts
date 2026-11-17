import { describe, expect, it, vi } from 'vitest';
import config from '@plone/registry';
import { getTranslationsOrThrow } from './translations.server';

const page = { '@id': 'http://example.com/en/page', '@type': 'Document' };

describe('getTranslationsOrThrow', () => {
  config.settings.apiPath = 'http://example.com';

  it('loads the translations of the content path', async () => {
    const translations = { items: [], root: {} };
    const getTranslation = vi.fn().mockResolvedValue({ data: translations });

    await expect(
      getTranslationsOrThrow({ getTranslation } as any, page as any),
    ).resolves.toBe(translations);
    expect(getTranslation).toHaveBeenCalledWith({ path: '/en/page' });
  });

  it('answers 400 for the site root without asking the backend', async () => {
    const getTranslation = vi.fn();

    await expect(
      getTranslationsOrThrow(
        { getTranslation } as any,
        {
          '@id': 'http://example.com',
          '@type': 'Plone Site',
        } as any,
      ),
    ).rejects.toMatchObject({ init: { status: 400 } });
    expect(getTranslation).not.toHaveBeenCalled();
  });

  it('answers 400 when the site has no multilingual support', async () => {
    const getTranslation = vi.fn().mockRejectedValue({ status: 404 });

    await expect(
      getTranslationsOrThrow({ getTranslation } as any, page as any),
    ).rejects.toMatchObject({
      data: 'Content is not translatable',
      init: { status: 400 },
    });
  });

  it.each([401, 500])('rethrows a %s from the backend', async (status) => {
    const failure = { status };
    const getTranslation = vi.fn().mockRejectedValue(failure);

    await expect(
      getTranslationsOrThrow({ getTranslation } as any, page as any),
    ).rejects.toBe(failure);
  });
});
