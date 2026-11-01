import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import config from '@plone/registry';
import { SearchField } from '@plone/quanta';
import type { Controlpanel } from '@plone/types';
import ChevronRight from '@plone/icons/svg/chevron-right.svg?react';
import { controlPanelId } from '../../helpers/controlpanels';

type ControlPanel = Pick<Controlpanel, '@id' | 'title' | 'group'>;

// The icons of each group take the next Quanta color family.
const groupTints = [
  'bg-quanta-arctic text-quanta-royal',
  'bg-quanta-aqua text-quanta-puya',
  'bg-quanta-cream text-quanta-bronze',
  'bg-quanta-ballet text-quanta-wine',
  'bg-quanta-daiquiri text-quanta-turtle',
];

/**
 * The control panels, as lists grouped like the backend groups them, with a
 * field to find one. Add-ons add theirs to `config.settings.controlpanels`,
 * their icons to `config.settings.controlPanelsIcons`, and their
 * descriptions as `cmsui.controlpanelDescriptions.<id>` translations.
 */
export const ControlPanelsList = ({
  controlpanels,
}: {
  controlpanels: ControlPanel[];
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const listId = useId();
  const Link = config.getComponent('Link').component!;
  const { controlPanelsIcons: icons = {}, filterControlPanels } =
    config.settings;

  let allControlPanels = controlpanels.concat(
    config.settings.controlpanels ?? [],
  ) as Controlpanel[];
  if (filterControlPanels) {
    allControlPanels = filterControlPanels(allControlPanels);
  }

  const panels = allControlPanels.map((panel, index) => {
    const id = controlPanelId(panel);
    return {
      ...panel,
      id,
      // Unique in the page, even when two panels end in the same id.
      domId: `${listId}-${index}`,
      description: t(`cmsui.controlpanelDescriptions.${id}`, {
        defaultValue: '',
      }),
    };
  });

  // Groups and panels keep the order the backend sends them in: Plone
  // orders the groups, and the panels by their translated title.
  const groups = panels.reduce<Record<string, typeof panels>>((acc, panel) => {
    (acc[panel.group || 'General'] ??= []).push(panel);
    return acc;
  }, {});
  const tints = Object.fromEntries(
    Object.keys(groups).map((group, index) => [
      group,
      groupTints[index % groupTints.length],
    ]),
  );

  const search = query.trim().toLocaleLowerCase();
  const visibleGroups = Object.entries(groups)
    .map(
      ([group, items]) =>
        [
          group,
          items.filter((panel) =>
            `${panel.title} ${panel.description}`
              .toLocaleLowerCase()
              .includes(search),
          ),
        ] as const,
    )
    .filter(([, items]) => items.length > 0);

  return (
    <div className="controlpanels @container flex flex-col gap-7">
      <SearchField
        aria-label={t('cmsui.siteSetupSearch.label')}
        placeholder={t('cmsui.siteSetupSearch.placeholder')}
        value={query}
        onChange={setQuery}
        className="max-w-[560px]"
      />
      {visibleGroups.map(([group, items]) => (
        <section key={group} className="controlpanels-group">
          <h2
            className={`
              mb-2.5 text-[13px] leading-5 font-semibold tracking-wide text-quanta-iron uppercase
            `}
          >
            {group}
          </h2>
          {/* Two columns when there's room, and a single panel takes half
            the width. The gaps between the rows show the list's background
            as dividers. */}
          <ul
            className={`
              grid gap-px overflow-hidden rounded-[10px] border border-quanta-smoke bg-quanta-smoke
              ${items.length > 1 ? '@2xl:grid-cols-2' : '@2xl:w-1/2'}
            `}
          >
            {items.map((panel) => {
              const Icon = (icons[panel.id] ?? icons.default) as
                React.ComponentType<{ className?: string }> | undefined;
              return (
                <li key={panel.domId} className="controlpanel-item">
                  {/* Named by its title, so the description doesn't make
                    the link's name long. */}
                  <Link
                    href={`/controlpanel/${panel.id}`}
                    aria-labelledby={`${panel.domId}-title`}
                    aria-describedby={
                      panel.description
                        ? `${panel.domId}-description`
                        : undefined
                    }
                    className={`
                      flex h-full min-h-16 items-center gap-3.5 bg-quanta-air px-4 py-2.5
                      text-quanta-denim no-underline outline-none
                      hover:bg-quanta-snow
                      focus-visible:outline-2 focus-visible:-outline-offset-2
                      focus-visible:outline-quanta-cobalt
                    `}
                  >
                    <span
                      aria-hidden="true"
                      className={`
                        flex size-9 shrink-0 items-center justify-center rounded-lg
                        ${tints[group]}
                      `}
                    >
                      {Icon && <Icon className="size-5" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span
                        id={`${panel.domId}-title`}
                        className="text-[15px] leading-[22px] font-semibold"
                      >
                        {panel.title}
                      </span>
                      {panel.description && (
                        <span
                          id={`${panel.domId}-description`}
                          className="text-[13px] leading-[18px] text-quanta-pigeon"
                        >
                          {panel.description}
                        </span>
                      )}
                    </span>
                    <ChevronRight className="size-[18px] shrink-0 text-quanta-dolphin" />
                  </Link>
                </li>
              );
            })}
            {/* Fills the empty cell of an odd row, so it doesn't show the
              divider color. */}
            {items.length > 1 && items.length % 2 === 1 && (
              <li
                aria-hidden="true"
                className={`
                  hidden bg-quanta-air
                  @2xl:block
                `}
              />
            )}
          </ul>
        </section>
      ))}
      {visibleGroups.length === 0 && (
        <p role="status" className="text-sm text-quanta-iron">
          {t('cmsui.siteSetupSearch.noResults', { query })}
        </p>
      )}
    </div>
  );
};

export default ControlPanelsList;
