import type { FunctionComponent, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@plone/components';
import config from '@plone/registry';
import Calendar from '@plone/components/icons/calendar.svg?react';
import Language from '@plone/components/icons/language.svg?react';
import Mail from '@plone/components/icons/mail.svg?react';
import Navigation from '@plone/components/icons/navigation.svg?react';
import World from '@plone/components/icons/world.svg?react';
import Search from '@plone/components/icons/search.svg?react';
import Social from '@plone/components/icons/social.svg?react';
import ImageIcon from '@plone/components/icons/image.svg?react';
import Code from '@plone/components/icons/code.svg?react';
import Discussion from '@plone/components/icons/discussion.svg?react';
import Edit from '@plone/components/icons/edit.svg?react';
import Undo from '@plone/components/icons/undo.svg?react';
import User from '@plone/components/icons/user.svg?react';
import LinkIcon from '@plone/components/icons/link.svg?react';
import Settings from '@plone/components/icons/settings.svg?react';

interface ControlPanel {
  '@id': string;
  title: string;
  group: string;
  id?: string;
}

type IconComponent = FunctionComponent<SVGProps<SVGSVGElement>>;

const iconFor = (id: string): IconComponent => {
  if (/date|time|calendar/.test(id)) return Calendar;
  if (/lang|translation|multilingual/.test(id)) return Language;
  if (/mail|smtp|email/.test(id)) return Mail;
  if (/nav/.test(id)) return Navigation;
  if (/search/.test(id)) return Search;
  if (/social/.test(id)) return Social;
  if (/imag/.test(id)) return ImageIcon;
  if (/markup|code|html|theme/.test(id)) return Code;
  if (/discussion|comment|moderate/.test(id)) return Discussion;
  if (/relation|alias|url|redirect|link/.test(id)) return LinkIcon;
  if (/undo/.test(id)) return Undo;
  if (/user|group|member|principal|sharing/.test(id)) return User;
  if (/rule|editing|content|dexterity|types/.test(id)) return Edit;
  if (/site/.test(id)) return World;
  return Settings;
};

export const ControlPanelsList = ({
  controlpanels,
}: {
  controlpanels: ControlPanel[];
}) => {
  const { t } = useTranslation();
  const addonsControlPanels: ControlPanel[] =
    config.settings.controlpanels || [];

  const auroraControlPanels = [
    {
      '@id': '/addons',
      group: t('cmsui.panelgroups.general'),
      title: t('cmsui.paneltitles.addons'),
    },
    {
      '@id': '/database',
      group: t('cmsui.panelgroups.general'),
      title: t('cmsui.paneltitles.database'),
    },
    {
      '@id': '/rules',
      group: t('cmsui.panelgroups.content'),
      title: t('cmsui.paneltitles.contentRules'),
    },
    {
      '@id': '/undo',
      group: t('cmsui.panelgroups.general'),
      title: t('cmsui.paneltitles.undo'),
    },
    {
      '@id': '/aliases',
      group: t('cmsui.panelgroups.general'),
      title: t('cmsui.paneltitles.urlmanagement'),
    },
    {
      '@id': '/relations',
      group: t('cmsui.panelgroups.content'),
      title: t('cmsui.paneltitles.relations'),
    },
    {
      '@id': '/moderate-comments',
      group: t('cmsui.panelgroups.content'),
      title: t('cmsui.paneltitles.moderatecomments'),
    },
    {
      '@id': '/users',
      group: t('cmsui.panelgroups.users'),
      title: t('cmsui.paneltitles.users'),
    },
    {
      '@id': '/usergroupmembership',
      group: t('cmsui.panelgroups.users'),
      title: t('cmsui.paneltitles.groupMembership'),
    },
    {
      '@id': '/groups',
      group: t('cmsui.panelgroups.users'),
      title: t('cmsui.paneltitles.groups'),
    },
  ];

  let allControlPanels = controlpanels.concat(
    auroraControlPanels,
    addonsControlPanels,
  );

  allControlPanels = allControlPanels.map((controlpanel) => ({
    ...controlpanel,
    id: controlpanel['@id'].split('/').pop() || '',
  }));

  const groupedPanels = allControlPanels.reduce(
    (acc, panel) => {
      const group = panel.group || 'General';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(panel);
      return acc;
    },
    {} as Record<string, ControlPanel[]>,
  );

  return (
    <div className="controlpanels-container controlpanels flex flex-col gap-10">
      {Object.entries(groupedPanels).map(([group, panels]) => (
        <section key={group} className="controlpanels-group">
          <h2 className="group-title cp-group-title mb-4">{group}</h2>
          <ul
            className={`
              controlpanels-list grid list-none grid-cols-2 gap-x-6 gap-y-5 p-0
              sm:grid-cols-3
              lg:grid-cols-4
            `}
          >
            {panels
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((panel) => {
                const Icon = iconFor(panel.id || '');
                return (
                  <li key={panel['@id']} className="controlpanel-item">
                    <Link
                      href={`/controlpanel/${panel.id}`}
                      className={`
                        controlpanel-link group flex flex-col items-center gap-2 no-underline
                      `}
                    >
                      <span
                        className={`
                          flex aspect-square w-full items-center justify-center rounded-lg
                          bg-quanta-snow text-quanta-iron transition
                          group-hover:bg-white group-hover:shadow-md group-hover:ring-1
                          group-hover:ring-border
                        `}
                      >
                        <Icon aria-hidden className="size-10" />
                      </span>
                      <span
                        className={`
                          text-center text-sm text-quanta-sapphire
                          group-hover:underline
                        `}
                      >
                        {panel.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default ControlPanelsList;
