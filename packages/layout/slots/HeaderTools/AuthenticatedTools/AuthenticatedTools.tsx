import config from '@plone/registry';
import { useTranslation } from 'react-i18next';

const AuthenticatedTools = () => {
  const { t } = useTranslation();
  const Link = config.getComponent('Link').component!;

  return (
    <Link href="/logout">{t('layout.slots.headertools.actions.logout')}</Link>
  );
};

export default AuthenticatedTools;
