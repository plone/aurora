import { data } from 'react-router';
import type PloneClient from '@plone/client';
import { flattenToAppURL } from '@plone/helpers';
import type { Content } from '@plone/types';

const notTranslatable = () =>
  data('Content is not translatable', { status: 400 });

/**
 * Loads the translations of `content`, answering 400 when it can't have any.
 * Other backend errors (an expired session, an outage) are rethrown as is.
 */
export async function getTranslationsOrThrow(
  cli: PloneClient,
  content: Content,
) {
  // The backend can't adapt the site root to a translation manager and
  // answers with a 500, so don't ask.
  if ((content['@type'] as string) === 'Plone Site') throw notTranslatable();
  try {
    const { data: translations } = await cli.getTranslation({
      path: flattenToAppURL(content['@id']),
    });
    return translations;
  } catch (error) {
    // Without multilingual support the endpoint doesn't exist.
    if ((error as { status?: unknown } | null)?.status === 404) {
      throw notTranslatable();
    }
    throw error;
  }
}
