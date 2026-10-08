import { Link } from '@plone/components';
import { useTranslation } from 'react-i18next';

const AuthenticatedTools = () => {
  const { t } = useTranslation();

  return (
    <Link href="/logout">{t('layout.slots.headertools.actions.logout')}</Link>
  );
};

export default AuthenticatedTools;
