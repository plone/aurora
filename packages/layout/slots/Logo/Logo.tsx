import type { SlotComponentProps } from '../SlotRenderer';
import clsx from 'clsx';
import config from '@plone/registry';
import { messages } from '../messages';

import styles from './Logo.module.css';
import LogoImage from './Logo.svg';
import { useRouteLoaderData } from 'react-router';
import type { RootLoaderData } from '@plone/types';

const Logo = (props: SlotComponentProps) => {
  const { content } = props;
  const Link = config.getComponent('Link').component!;
  const rootData = useRouteLoaderData<RootLoaderData>('root');

  const intl: (id: string) => string = config.getUtility({
    name: 'translation',
    type: 'factory',
  }).method;

  const navRootPath =
    content?.['@components']?.navroot?.navroot?.['@id'] || '/';
  const site = rootData?.site;
  const siteTitle = site?.['plone.site_title'] || '';
  const logoUrl = site?.['plone.site_logo']
    ? site['plone.site_logo']
    : LogoImage;

  return (
    <Link
      href={navRootPath}
      aria-label={intl(messages.home)}
      className={clsx(styles.logo, 'logo')}
    >
      <img src={logoUrl} alt={intl(messages.logoOf) + ' ' + siteTitle} />
    </Link>
  );
};

export default Logo;
