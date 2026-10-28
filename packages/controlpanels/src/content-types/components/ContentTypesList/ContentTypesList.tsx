import { useCallback, useMemo, useState } from 'react';
import type { Key, Selection } from 'react-aria-components';
import {
  Button,
  Cell,
  Column,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Row,
  SearchField,
  Switch,
  Table,
  TableBody,
  TableHeader,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
} from '@plone/quanta';
import { MoreoptionsIcon } from '@plone/icons';
import {
  useNavigate,
  useNotify,
  useTranslate,
} from '../../../provider/ControlPanelsProvider';
import type { Message } from '../../../provider/messages';
import { useContentTypesDriver } from '../../driver';
import { messages } from '../../messages';
import {
  CONTENT_TYPES_BASE_PATH,
  contentTypeHref,
  type ContentTypeTab,
} from '../../paths';
import type {
  ContentTypeSummary,
  SiteDefaults,
  VersioningPolicy,
  WorkflowInfo,
} from '../../types';
import { useDriverData } from '../../useDriverData';
import { AddContentTypeDialog } from '../AddContentTypeDialog/AddContentTypeDialog';
import { DeleteContentTypesDialog } from '../DeleteContentTypesDialog/DeleteContentTypesDialog';
import { ChangeWorkflowDialog } from '../WorkflowTab/ChangeWorkflowDialog';

export interface ContentTypesListProps {
  /** Where the control panel lives. Type pages are below it. */
  basePath?: string;
}

type Filter = 'all' | 'not-addable';

const VERSIONING: Record<VersioningPolicy, Message> = {
  off: messages.versioningOff,
  manual: messages.versioningManual,
  automatic: messages.versioningAutomatic,
};

const TABS: Array<[ContentTypeTab, Message]> = [
  ['settings', messages.tabSettings],
  ['workflow', messages.tabWorkflow],
  ['fields', messages.tabFields],
  ['behaviors', messages.tabBehaviors],
  ['layout', messages.tabLayout],
];

interface ListData {
  types: ContentTypeSummary[];
  workflows: WorkflowInfo[];
  /** The site default workflow, when the driver knows it. */
  defaultWorkflow?: string | null;
  siteDefaults?: SiteDefaults;
}

/**
 * The content types control panel's start page: every type, with search,
 * filters, an inline Addable switch, a row menu for each type's tabs, and
 * adding, copying and deleting types. Columns and actions the driver can't
 * provide are left out.
 */
export function ContentTypesList({
  basePath = CONTENT_TYPES_BASE_PATH,
}: ContentTypesListProps) {
  const t = useTranslate();
  const notify = useNotify();
  const navigate = useNavigate();
  const driver = useContentTypesDriver();
  const { capabilities } = driver;

  const load = useCallback(async (): Promise<ListData> => {
    const [types, workflows, assignments, siteDefaults] = await Promise.all([
      driver.listTypes(),
      capabilities.workflows && driver.listWorkflows
        ? driver.listWorkflows()
        : Promise.resolve([]),
      capabilities.workflows && driver.getWorkflowAssignments
        ? driver.getWorkflowAssignments()
        : Promise.resolve(undefined),
      capabilities.siteDefaults && driver.getSiteDefaults
        ? driver.getSiteDefaults()
        : Promise.resolve(undefined),
    ]);
    return {
      types,
      workflows,
      defaultWorkflow: siteDefaults?.workflow ?? assignments?.default,
      siteDefaults,
    };
  }, [driver, capabilities]);
  const { data, error, isLoading, reload, setData } = useDriverData(load);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Selection>(new Set());
  const [adding, setAdding] = useState<{ copyFrom?: string } | null>(null);
  const [deleting, setDeleting] = useState<ContentTypeSummary[]>([]);
  const [changingWorkflow, setChangingWorkflow] = useState<
    { types: ContentTypeSummary[] } | { siteDefault: true } | null
  >(null);

  const types = data?.types ?? [];
  const workflowTitle = useMemo(() => {
    const titles = new Map(
      (data?.workflows ?? []).map((workflow) => [workflow.id, workflow.title]),
    );
    return (id: string | null) =>
      id === null ? t(messages.noWorkflow) : (titles.get(id) ?? id);
  }, [data?.workflows, t]);

  const notAddable = types.filter((type) => type.globalAllow === false);
  const query = search.trim().toLowerCase();
  const visible = (filter === 'not-addable' ? notAddable : types).filter(
    (type) =>
      !query ||
      type.title.toLowerCase().includes(query) ||
      type.id.toLowerCase().includes(query),
  );
  const selectedTypes =
    selected === 'all'
      ? visible.filter((type) => type.kind !== 'site')
      : types.filter((type) => selected.has(type.id));

  const setGlobalAllow = async (type: ContentTypeSummary, value: boolean) => {
    const change = (globalAllow: boolean) =>
      setData(
        (current) =>
          current && {
            ...current,
            types: current.types.map((entry) =>
              entry.id === type.id ? { ...entry, globalAllow } : entry,
            ),
          },
      );
    change(value);
    try {
      await driver.updateType(type.id, { globalAllow: value });
      notify({
        title: t(messages.updated, { title: type.title }),
        variant: 'success',
      });
    } catch (reason) {
      change(!value);
      notify({
        title: t(messages.updateError, { title: type.title }),
        description: reason instanceof Error ? reason.message : undefined,
        variant: 'error',
      });
    }
  };

  const onRowAction = (type: ContentTypeSummary, key: Key) => {
    if (key === 'copy') setAdding({ copyFrom: type.id });
    if (key === 'delete') setDeleting([type]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t(messages.title)}</h1>
          <p className="text-sm text-quanta-pigeon">
            {t(messages.description)}
          </p>
        </div>
        <Button variant="primary" accent onPress={() => setAdding({})}>
          {t(messages.addType)}
        </Button>
      </div>

      {(data?.siteDefaults || data?.defaultWorkflow !== undefined) && (
        <section
          aria-label={t(messages.siteDefaults)}
          className={`
            flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border border-quanta-smoke
            bg-quanta-snow px-4 py-3 text-sm
          `}
        >
          <span className="text-quanta-pigeon">{t(messages.siteDefaults)}</span>
          {data.defaultWorkflow !== undefined && (
            <span className="flex items-center gap-2">
              {t(messages.defaultWorkflow, {
                workflow: workflowTitle(data.defaultWorkflow),
              })}
              {capabilities.workflowChange && (
                <Button
                  size="S"
                  aria-label={t(messages.changeDefaultWorkflowTitle)}
                  onPress={() => setChangingWorkflow({ siteDefault: true })}
                >
                  {t(messages.changeDefault)}
                </Button>
              )}
            </span>
          )}
          {data.siteDefaults && (
            <span>
              {t(messages.newTypesStart, {
                addable: t(
                  data.siteDefaults.globalAllow
                    ? messages.globallyAddable
                    : messages.notGloballyAddable,
                ),
                versioning: t(
                  VERSIONING[data.siteDefaults.versioning],
                ).toLowerCase(),
              })}
            </span>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          aria-label={t(messages.filter)}
          placeholder={t(messages.filter)}
          value={search}
          onChange={setSearch}
          className="w-full max-w-xs"
        />
        {capabilities.globalAllow && (
          <ToggleButtonGroup
            aria-label={t(messages.show)}
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[filter]}
            onSelectionChange={(keys) => {
              const [key] = [...keys];
              if (key) setFilter(key as Filter);
            }}
          >
            <ToggleButton id="all">
              {t(messages.showAll, { count: types.length })}
            </ToggleButton>
            <ToggleButton id="not-addable">
              {t(messages.showNotAddable, { count: notAddable.length })}
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </div>

      {selectedTypes.length > 0 && (
        <Toolbar
          aria-label={t(messages.selection)}
          className={`
            flex items-center gap-3 rounded-md bg-quanta-denim px-3 py-2 text-sm text-quanta-air
          `}
        >
          <span>{t(messages.selected, { count: selectedTypes.length })}</span>
          {capabilities.workflowChange && (
            <Button
              size="S"
              onPress={() => setChangingWorkflow({ types: selectedTypes })}
            >
              {t(messages.changeWorkflowBulk)}
            </Button>
          )}
          <Button size="S" onPress={() => setDeleting(selectedTypes)}>
            {t(messages.delete)}
          </Button>
        </Toolbar>
      )}

      {error ? (
        <div role="alert" className="flex items-center gap-3 text-sm">
          <span>{t(messages.loadError)}</span>
          <Button onPress={() => void reload()}>{t(messages.retry)}</Button>
        </div>
      ) : (
        <Table
          aria-label={t(messages.title)}
          selectionMode="multiple"
          selectionBehavior="toggle"
          selectedKeys={selected}
          onSelectionChange={setSelected}
          disabledKeys={types
            .filter((type) => type.kind === 'site')
            .map((type) => type.id)}
          disabledBehavior="selection"
          className="max-h-none"
        >
          <TableHeader>
            <Column id="type" isRowHeader>
              {t(messages.columnType)}
            </Column>
            {capabilities.workflows ? (
              <Column id="workflow">{t(messages.columnWorkflow)}</Column>
            ) : null}
            {capabilities.globalAllow ? (
              <Column id="addable" width={100}>
                {t(messages.columnAddable)}
              </Column>
            ) : null}
            {capabilities.versioning ? (
              <Column id="versioning" width={120}>
                {t(messages.columnVersioning)}
              </Column>
            ) : null}
            <Column id="items" width={80}>
              {t(messages.columnItems)}
            </Column>
            <Column id="actions" width={56}>
              <span className="sr-only">{t(messages.columnActions)}</span>
            </Column>
          </TableHeader>
          <TableBody
            items={visible}
            renderEmptyState={() => (
              <div className="p-4">
                {isLoading ? t(messages.loading) : t(messages.noMatches)}
              </div>
            )}
          >
            {(type) => (
              <Row
                id={type.id}
                href={contentTypeHref(basePath, type.id)}
                textValue={type.title}
              >
                <Cell>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2 font-medium">
                      {type.title}
                      {type.kind === 'other' && (
                        <span
                          className={`
                            rounded-full border border-quanta-smoke px-2 text-xs font-normal
                          `}
                        >
                          {t(messages.settingsOnly)}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs opacity-70">
                      {type.id}
                    </span>
                  </div>
                </Cell>
                {capabilities.workflows ? (
                  <Cell>
                    {type.workflow && (
                      <div className="flex flex-col">
                        <span>{workflowTitle(type.workflow.workflow)}</span>
                        {type.workflow.followsDefault && (
                          <span className="text-xs opacity-70">
                            {t(messages.siteDefault)}
                          </span>
                        )}
                      </div>
                    )}
                  </Cell>
                ) : null}
                {capabilities.globalAllow ? (
                  <Cell>
                    {type.kind === 'dexterity' &&
                      type.globalAllow !== undefined && (
                        <Switch
                          aria-label={t(messages.addable, {
                            title: type.title,
                          })}
                          isSelected={type.globalAllow}
                          onChange={(value) => void setGlobalAllow(type, value)}
                        >
                          {null}
                        </Switch>
                      )}
                  </Cell>
                ) : null}
                {capabilities.versioning ? (
                  <Cell>
                    {type.versioning && t(VERSIONING[type.versioning])}
                  </Cell>
                ) : null}
                <Cell>
                  <span className="tabular-nums">{type.count}</span>
                </Cell>
                <Cell>
                  <MenuTrigger>
                    <Button
                      variant="icon"
                      aria-label={t(messages.actionsFor, { title: type.title })}
                    >
                      <MoreoptionsIcon size="sm" aria-hidden />
                    </Button>
                    <Menu
                      aria-label={t(messages.actionsFor, { title: type.title })}
                      onAction={(key) => onRowAction(type, key)}
                      disabledKeys={
                        type.kind === 'other'
                          ? ['fields', 'behaviors', 'layout']
                          : []
                      }
                    >
                      {TABS.map(([tab, label]) => (
                        <MenuItem
                          key={tab}
                          id={tab}
                          href={contentTypeHref(basePath, type.id, tab)}
                        >
                          {t(label)}
                        </MenuItem>
                      ))}
                      {(capabilities.copyType && type.kind === 'dexterity') ||
                      type.kind !== 'site' ? (
                        <MenuSeparator />
                      ) : null}
                      {capabilities.copyType && type.kind === 'dexterity' ? (
                        <MenuItem id="copy">{t(messages.copy)}</MenuItem>
                      ) : null}
                      {type.kind !== 'site' ? (
                        <MenuItem id="delete">{t(messages.delete)}</MenuItem>
                      ) : null}
                    </Menu>
                  </MenuTrigger>
                </Cell>
              </Row>
            )}
          </TableBody>
        </Table>
      )}

      <AddContentTypeDialog
        isOpen={adding !== null}
        onOpenChange={(isOpen) => !isOpen && setAdding(null)}
        types={types}
        copyFrom={adding?.copyFrom}
        onCreated={(type) => {
          void reload();
          navigate(contentTypeHref(basePath, type.id, 'fields'));
        }}
      />
      {capabilities.workflowChange && (
        <ChangeWorkflowDialog
          isOpen={changingWorkflow !== null}
          onOpenChange={(isOpen) => !isOpen && setChangingWorkflow(null)}
          types={
            changingWorkflow && 'types' in changingWorkflow
              ? changingWorkflow.types
              : types
          }
          siteDefault={!!changingWorkflow && 'siteDefault' in changingWorkflow}
          workflows={data?.workflows ?? []}
          defaultWorkflow={data?.defaultWorkflow ?? null}
          onChanged={() => void reload()}
        />
      )}
      <DeleteContentTypesDialog
        types={deleting}
        onClose={() => setDeleting([])}
        onDeleted={(ids) => {
          setSelected((current) =>
            current === 'all'
              ? new Set()
              : new Set(
                  [...current].filter((key) => !ids.includes(String(key))),
                ),
          );
          void reload();
        }}
      />
    </div>
  );
}
