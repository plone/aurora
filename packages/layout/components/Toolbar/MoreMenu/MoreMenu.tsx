import { useCallback, useState } from 'react';
import {
  Header,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  SubmenuTrigger,
  Text,
} from 'react-aria-components';
import {
  ChevrondownIcon,
  ChevronrightIcon,
  HistoryIcon,
  LinkIcon,
  MandatoryIcon,
  MoreoptionsIcon,
  ShareIcon,
} from '@plone/icons';
import { useTranslation } from 'react-i18next';
import { ToolbarMenu } from '../ToolbarMenu';
import styles from './MoreMenu.css?inline';

type Action = { id: string; title: string; url: string };
export interface MoreMenuProps {
  content: {
    title: string;
    '@type': string;
    modified?: string;
    layout?: string | null;
    review_state?: string | null;
    working_copy?: unknown;
    working_copy_of?: unknown;
  };
  path: string;
  actions?: {
    object?: Action[];
    object_buttons?: Action[];
    more_menu?: Action[];
  };
  workflow?: {
    state?: { id: string; title: string };
    transitions?: { '@id': string; title: string }[];
  } | null;
  layouts?: string[];
  multilingual?: boolean;
  onChange: (
    operation: 'workflow' | 'layout' | 'checkout' | 'checkin' | 'discard',
    value: string,
  ) => void;
}

export function MoreMenu({
  content,
  path,
  actions,
  workflow,
  layouts = [],
  multilingual = false,
  onChange,
}: MoreMenuProps) {
  const { t, i18n } = useTranslation();
  const focusDropdown = useCallback((node: HTMLDivElement | null) => {
    if (node)
      requestAnimationFrame(() => {
        if (node.isConnected)
          node.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
      });
  }, []);
  const [view, setView] = useState<'main' | 'layout' | 'discard'>('main');
  const links = actions?.more_menu;
  const workingCopy = content.working_copy as
    { '@id'?: string } | null | undefined;
  const isSite = content['@type'] === 'Plone Site';
  const sharing = actions?.object?.find(
    (action) => action.id === 'local_roles',
  );
  const history = actions?.object?.find((action) => action.id === 'history');
  const rules = actions?.object?.find((action) => action.id === 'contentrules');
  const canEdit = actions?.object?.some((action) => action.id === 'edit');
  const aliases = actions?.object_buttons?.find(
    (action) => action.id === 'redirection',
  );
  const checkout = actions?.object_buttons?.some(
    (action) => action.id === 'iterate_checkout',
  );
  const checkin = actions?.object_buttons?.some(
    (action) => action.id === 'iterate_checkin',
  );
  const basePath = path === '/' ? '' : path.replace(/\/$/, '');
  const label = t('layout.moreMenu.label', { defaultValue: 'More' });
  const perform = (key: React.Key) => {
    const id = String(key);
    if (id === 'discard' || id === 'layout') setView(id);
    else if (id.startsWith('layout:')) {
      onChange('layout', id.slice(7));
      setView('main');
    } else if (id === 'back') setView('main');
    else if (
      id === 'checkout' ||
      id === 'checkin' ||
      id === 'confirm-discard'
    ) {
      onChange(id === 'confirm-discard' ? 'discard' : id, 'confirm');
      setView('main');
    }
  };
  const date = content.modified ? new Date(content.modified) : null;
  return (
    <ToolbarMenu
      mobileSheet
      icon={<MoreoptionsIcon />}
      triggerLabel={label}
      styles={styles}
      placement="right top"
      onMenuOpen={() => setView('main')}
    >
      <Menu className="more-menu" aria-label={label} onAction={perform}>
        <MenuSection key={view}>
          <Header>
            {t('layout.moreMenu.pageSettings', {
              defaultValue: 'Page settings',
            })}{' '}
            — {content.title}
          </Header>
          {view === 'main' ? (
            <>
              {!isSite && workflow?.state && (
                <SubmenuTrigger>
                  <MenuItem
                    id="workflow"
                    textValue={t('layout.moreMenu.state', {
                      defaultValue: 'State',
                    })}
                    isDisabled={!workflow.transitions?.length}
                  >
                    <span className="more-menu-label">
                      {t('layout.moreMenu.state', { defaultValue: 'State' })}
                    </span>
                    <MandatoryIcon className="more-menu-state-icon" />
                    <span className="more-menu-value">
                      {workflow.state.title}
                    </span>
                    <ChevrondownIcon />
                  </MenuItem>
                  <Popover
                    className="react-aria-Popover more-menu-dropdown"
                    placement="bottom end"
                    isNonModal
                  >
                    <Menu
                      ref={focusDropdown}
                      aria-label={t('layout.moreMenu.transitions', {
                        defaultValue: 'Workflow transitions',
                      })}
                      onAction={(key) => onChange('workflow', String(key))}
                    >
                      {workflow.transitions?.map((transition) => {
                        const id = transition['@id'].split('/').pop() || '';
                        return (
                          <MenuItem
                            key={id}
                            id={id}
                            textValue={transition.title}
                          >
                            <Text slot="label">{transition.title}</Text>
                          </MenuItem>
                        );
                      })}
                    </Menu>
                  </Popover>
                </SubmenuTrigger>
              )}
              {!isSite && layouts.length > 1 && (
                <MenuItem
                  id="layout"
                  textValue={t('layout.moreMenu.appearance', {
                    defaultValue: 'Appearance',
                  })}
                  shouldCloseOnSelect={false}
                >
                  <span className="more-menu-label">
                    {t('layout.moreMenu.appearance', {
                      defaultValue: 'Appearance',
                    })}
                  </span>
                  <span className="more-menu-value">
                    {content.layout || layouts[0]}
                  </span>
                  <ChevrondownIcon />
                </MenuItem>
              )}
              {!isSite && date && !Number.isNaN(date.getTime()) && (
                <MenuItem
                  id="modified"
                  isDisabled
                  textValue={t('layout.moreMenu.modified', {
                    defaultValue: 'Last modified',
                  })}
                >
                  <span className="more-menu-label">
                    {t('layout.moreMenu.modified', {
                      defaultValue: 'Last modified',
                    })}
                  </span>
                  <span className="more-menu-value">
                    {date.toLocaleDateString(i18n.language, {
                      dateStyle: 'medium',
                    })}
                  </span>
                </MenuItem>
              )}
              {links?.length ? (
                links.map((action) => (
                  <MenuItem
                    key={action.id}
                    id={`custom:${action.id}`}
                    href={action.url}
                    textValue={action.title}
                  >
                    <Text slot="label">{action.title}</Text>
                    <ChevronrightIcon />
                  </MenuItem>
                ))
              ) : (
                <>
                  {!isSite && history && (
                    <MenuItem
                      href={`/@@history${basePath}`}
                      textValue={history.title}
                    >
                      <HistoryIcon />
                      <Text slot="label">{history.title}</Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                  {sharing && (
                    <MenuItem
                      href={`/@@sharing${basePath}`}
                      textValue={t('layout.moreMenu.sharing', {
                        defaultValue: 'Sharing',
                      })}
                    >
                      <ShareIcon />
                      <Text slot="label">
                        {t('layout.moreMenu.sharing', {
                          defaultValue: 'Sharing',
                        })}
                      </Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                  {aliases && (
                    <MenuItem
                      href={`/@@aliases${basePath}`}
                      textValue={t('layout.moreMenu.aliases', {
                        defaultValue: 'URL management',
                      })}
                    >
                      <LinkIcon />
                      <Text slot="label">
                        {t('layout.moreMenu.aliases', {
                          defaultValue: 'URL management',
                        })}
                      </Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                  {basePath && canEdit && (
                    <MenuItem
                      href={`/@@links-to-item${basePath}`}
                      textValue={t('layout.moreMenu.links', {
                        defaultValue: 'Links and references',
                      })}
                    >
                      <LinkIcon />
                      <Text slot="label">
                        {t('layout.moreMenu.links', {
                          defaultValue: 'Links and references',
                        })}
                      </Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                  {rules && (
                    <MenuItem
                      href={`/@@rules${basePath}`}
                      textValue={t('layout.moreMenu.rules', {
                        defaultValue: 'Rules',
                      })}
                    >
                      <Text slot="label">
                        {t('layout.moreMenu.rules', { defaultValue: 'Rules' })}
                      </Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                  {canEdit && multilingual && (
                    <MenuItem
                      href={`/@@manage-translations${basePath}`}
                      textValue={t('layout.moreMenu.translations', {
                        defaultValue: 'Manage translations',
                      })}
                    >
                      <Text slot="label">
                        {t('layout.moreMenu.translations', {
                          defaultValue: 'Manage translations',
                        })}
                      </Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                  {checkout && (
                    <MenuItem
                      id="checkout"
                      textValue={t('layout.moreMenu.checkout', {
                        defaultValue: 'Create working copy',
                      })}
                    >
                      <Text slot="label">
                        {t('layout.moreMenu.checkout', {
                          defaultValue: 'Create working copy',
                        })}
                      </Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                  {checkin && (
                    <MenuItem
                      id="checkin"
                      textValue={t('layout.moreMenu.checkin', {
                        defaultValue: 'Apply working copy',
                      })}
                    >
                      <Text slot="label">
                        {t('layout.moreMenu.checkin', {
                          defaultValue: 'Apply working copy',
                        })}
                      </Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                  {checkin && (
                    <MenuItem
                      id="discard"
                      shouldCloseOnSelect={false}
                      textValue={t('layout.moreMenu.discard', {
                        defaultValue: 'Discard working copy',
                      })}
                    >
                      <Text slot="label">
                        {t('layout.moreMenu.discard', {
                          defaultValue: 'Discard working copy',
                        })}
                      </Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                  {workingCopy?.['@id'] && !content.working_copy_of && (
                    <MenuItem
                      href={workingCopy['@id']}
                      textValue={t('layout.moreMenu.viewWorkingCopy', {
                        defaultValue: 'View working copy',
                      })}
                    >
                      <Text slot="label">
                        {t('layout.moreMenu.viewWorkingCopy', {
                          defaultValue: 'View working copy',
                        })}
                      </Text>
                      <ChevronrightIcon />
                    </MenuItem>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <MenuItem
                id="back"
                shouldCloseOnSelect={false}
                textValue={t('layout.moreMenu.back', { defaultValue: 'Back' })}
              >
                <Text slot="label">
                  {t('layout.moreMenu.back', { defaultValue: 'Back' })}
                </Text>
              </MenuItem>
              {view === 'discard' ? (
                <MenuItem
                  id="confirm-discard"
                  textValue={t('layout.moreMenu.confirmDiscard', {
                    defaultValue: 'Confirm discard working copy',
                  })}
                >
                  <Text slot="label">
                    {t('layout.moreMenu.confirmDiscard', {
                      defaultValue: 'Confirm discard working copy',
                    })}
                  </Text>
                </MenuItem>
              ) : (
                layouts.map((layout) => (
                  <MenuItem
                    key={layout}
                    id={`layout:${layout}`}
                    textValue={layout}
                  >
                    <Text slot="label">{layout}</Text>
                  </MenuItem>
                ))
              )}
            </>
          )}
        </MenuSection>
      </Menu>
    </ToolbarMenu>
  );
}
