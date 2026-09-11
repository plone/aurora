import { useTranslation } from 'react-i18next';
import { Link } from '@plone/components';
import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '@plone/aurora/app/root';

const HeaderTools = () => {
  const { t } = useTranslation();
  const rootData = useRouteLoaderData<RootLoader>('root');
  const isAuthenticated = rootData?.isAuthenticated ?? false;

  // Convenience auth links while developing Plone Aurora.
  if (!import.meta.env.DEV) {
    return null;
  }

  return isAuthenticated ? (
    <Link href="/logout">{t('layout.tools.logout', 'Log out')}</Link>
  ) : (
    <Link href="/login">{t('layout.tools.login', 'Log in')}</Link>
  );
};

export default HeaderTools;
