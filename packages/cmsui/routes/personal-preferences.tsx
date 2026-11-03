import {
  data,
  Form,
  redirect,
  useLoaderData,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  RouterContextProvider,
} from 'react-router';
import { localeCookie, requireAuthCookie } from '@plone/react-router';
import { getLocale } from '@plone/aurora/app/i18next.server';
import config from '@plone/registry';
import { Container, Link } from '@plone/quanta';
import { useTranslation } from 'react-i18next';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  return {
    locale: getLocale(context),
    languages: config.settings.supportedLanguages as string[],
  };
}

export async function action({
  request,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const language = (await request.formData()).get('language');
  if (
    typeof language !== 'string' ||
    !config.settings.supportedLanguages.includes(language)
  ) {
    return data({ error: 'Invalid language' }, { status: 400 });
  }
  return redirect('/@@personal-preferences?saved=1', {
    headers: { 'Set-Cookie': await localeCookie.serialize(language) },
  });
}

export default function PersonalPreferences() {
  const { locale, languages } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  return (
    <main>
      <Container width="default">
        <h1>
          {t('cmsui.personalPreferences.title', {
            defaultValue: 'Personal preferences',
          })}
        </h1>
        {searchParams.has('saved') && (
          <p role="status">
            {t('cmsui.personalInformation.saved', {
              defaultValue: 'Changes saved',
            })}
          </p>
        )}
        <Form method="post">
          <label htmlFor="language">
            {t('cmsui.personalPreferences.language', {
              defaultValue: 'Language',
            })}
          </label>{' '}
          <select id="language" name="language" defaultValue={locale}>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {new Intl.DisplayNames([locale], { type: 'language' }).of(
                  lang,
                ) || lang}
              </option>
            ))}
          </select>
          <p>
            <button type="submit">{t('cmsui.save')}</button>{' '}
            <Link href="/">{t('cmsui.cancel')}</Link>
          </p>
        </Form>
      </Container>
    </main>
  );
}
