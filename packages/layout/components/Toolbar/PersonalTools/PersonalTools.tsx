import { ToolbarMenu } from '../ToolbarMenu';
import { UserIcon, MixerIcon, OutIcon, SettingsIcon } from '@plone/icons';
import {
  Header,
  Menu,
  MenuItem,
  MenuSection,
  Text,
} from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import styles from './PersonalTools.css?inline';

interface PersonalToolsProps {
  user: {
    fullname?: string;
    username?: string;
    id?: string;
    email?: string;
    portrait?: string | null;
  } | null;
  actions?: {
    user?: { id: string }[];
    personal_tools?: { id: string; title: string; url: string }[];
  };
}

export function PersonalTools({ user, actions }: PersonalToolsProps) {
  const { t } = useTranslation();
  const name = user?.fullname || user?.username || user?.id;
  const canManageSite = actions?.user?.some(
    (action) => action.id === 'plone_setup',
  );
  const personalActions = actions?.personal_tools;

  return (
    <ToolbarMenu
      icon={<UserIcon />}
      triggerLabel={t('layout.personalTools.label', {
        defaultValue: 'Personal tools',
      })}
      styles={styles}
      placement="right bottom"
    >
      <Menu
        className="personal-tools-menu"
        aria-label={t('layout.personalTools.label', {
          defaultValue: 'Personal tools',
        })}
      >
        <MenuSection>
          <Header>
            <div className="personal-tools-identity">
              {name}
              {user?.email && user.email !== name ? ` — ${user.email}` : ''}
            </div>
            <div className="personal-tools-avatar">
              {user?.portrait ? (
                <img
                  className="personal-tools-portrait"
                  src={user.portrait}
                  alt=""
                />
              ) : (
                <UserIcon aria-hidden="true" />
              )}
            </div>
          </Header>
          {personalActions?.length ? (
            personalActions.map((action) => (
              <MenuItem
                key={action.id}
                id={action.id}
                href={action.url}
                textValue={action.title}
              >
                <Text slot="label">{action.title}</Text>
              </MenuItem>
            ))
          ) : (
            <>
              <MenuItem
                href="/personal-information"
                textValue={t('layout.personalTools.profile', {
                  defaultValue: 'Profile',
                })}
              >
                <UserIcon />
                <Text slot="label">
                  {t('layout.personalTools.profile', {
                    defaultValue: 'Profile',
                  })}
                </Text>
              </MenuItem>
              <MenuItem
                href="/personal-preferences"
                textValue={t('layout.personalTools.preferences', {
                  defaultValue: 'Preferences',
                })}
              >
                <MixerIcon />
                <Text slot="label">
                  {t('layout.personalTools.preferences', {
                    defaultValue: 'Preferences',
                  })}
                </Text>
              </MenuItem>
              {canManageSite && (
                <MenuItem
                  href="/controlpanel"
                  textValue={t('layout.personalTools.siteSetup', {
                    defaultValue: 'Site setup',
                  })}
                >
                  <SettingsIcon />
                  <Text slot="label">
                    {t('layout.personalTools.siteSetup', {
                      defaultValue: 'Site setup',
                    })}
                  </Text>
                </MenuItem>
              )}
              <MenuItem
                href="/logout"
                textValue={t('layout.personalTools.logout', {
                  defaultValue: 'Log out',
                })}
              >
                <OutIcon />
                <Text slot="label">
                  {t('layout.personalTools.logout', {
                    defaultValue: 'Log out',
                  })}
                </Text>
              </MenuItem>
            </>
          )}
        </MenuSection>
      </Menu>
    </ToolbarMenu>
  );
}
