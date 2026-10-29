import type { SlotComponentProps } from '../SlotRenderer';
import config from '@plone/registry';
import styles from './Navigation.module.css';
import clsx from 'clsx';

type NavItem = {
  '@id': string;
  title: string;
};

const Navigation = (props: SlotComponentProps) => {
  const { content } = props;
  const Link = config.getComponent('Link').component!;
  const navItems = content?.['@components']?.navigation?.items || [];

  return (
    <nav
      id="navigation"
      aria-label="navigation"
      className={clsx(styles.navigation, 'navigation')}
    >
      <ul>
        {navItems.map((item: NavItem) => (
          <li key={item['@id']}>
            <Link href={item['@id']}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;
