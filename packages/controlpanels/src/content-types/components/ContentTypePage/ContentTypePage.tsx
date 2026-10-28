import { useCallback, useMemo, useState } from 'react';
import { atom, useAtomValue } from 'jotai';
import { FormProvider, useFormStore, type FormApi } from '@plone/helpers';
import {
  Button,
  Dialog,
  Heading,
  Modal,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@plone/quanta';
import {
  useNavigationBlocker,
  useNotify,
  useTranslate,
} from '../../../provider/ControlPanelsProvider';
import type { Message } from '../../../provider/messages';
import { useContentTypesDriver } from '../../driver';
import {
  TAB_FIELDS,
  changedSchema,
  changedSettings,
  toEditableSettings,
  type EditableSettings,
} from '../../editableSettings';
import { messages } from '../../messages';
import {
  CONTENT_TYPES_BASE_PATH,
  contentTypeHref,
  type ContentTypeTab,
} from '../../paths';
import type {
  BehaviorInfo,
  ContentTypeSettings,
  ContentTypeSummary,
  TypeSchema,
  WorkflowInfo,
} from '../../types';
import { useDriverData } from '../../useDriverData';
import { BehaviorsTab } from '../BehaviorsTab/BehaviorsTab';
import { FieldsTab } from '../FieldsTab/FieldsTab';
import { SettingsTab } from '../SettingsTab/SettingsTab';

export interface ContentTypePageProps {
  /** The type's short name. */
  id: string;
  /** The open tab, from the URL. */
  tab?: ContentTypeTab;
  /** Where the control panel lives. */
  basePath?: string;
}

const TABS: Array<[ContentTypeTab, Message]> = [
  ['settings', messages.tabSettings],
  ['workflow', messages.tabWorkflow],
  ['fields', messages.tabFields],
  ['behaviors', messages.tabBehaviors],
  ['layout', messages.tabLayout],
];

const tabLabel = (tab: ContentTypeTab) => TABS.find(([id]) => id === tab)![1];

/** Whether any of a form's fields has unsaved changes. */
function useDirty(form: FormApi<EditableSettings>, fields: string[]) {
  const dirtyAtom = useMemo(
    () =>
      atom((get) => fields.some((field) => get(form.metaAtom(field)).dirty)),
    // The fields of a tab never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form],
  );
  return useAtomValue(dirtyAtom, { store: form.store });
}

function DirtyDot({
  form,
  tab,
}: {
  form: FormApi<EditableSettings>;
  tab: ContentTypeTab;
}) {
  const t = useTranslate();
  const dirty = useDirty(form, TAB_FIELDS[tab] ?? []);
  if (!dirty) return null;
  return (
    <span
      className="ml-1.5 inline-block size-2 rounded-full bg-quanta-gold"
      role="img"
      aria-label={t(messages.unsavedChanges)}
    />
  );
}

/** Which tabs have unsaved changes. */
function useDirtyTabs(form: FormApi<EditableSettings>): ContentTypeTab[] {
  const dirtyTabsAtom = useMemo(
    () =>
      atom((get) =>
        TABS.map(([tab]) => tab).filter((tab) =>
          (TAB_FIELDS[tab] ?? []).some(
            (field) => get(form.metaAtom(field)).dirty,
          ),
        ),
      ),
    [form],
  );
  return useAtomValue(dirtyTabsAtom, { store: form.store });
}

function SaveBar({
  form,
  isSaving,
  onSave,
}: {
  form: FormApi<EditableSettings>;
  isSaving: boolean;
  onSave: () => void;
}) {
  const t = useTranslate();
  const dirtyTabs = useDirtyTabs(form);
  if (!dirtyTabs.length) return null;
  return (
    <div
      role="region"
      aria-label={t(messages.unsavedChanges)}
      className={`
        sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t
        border-quanta-smoke bg-quanta-cream/95 px-4 py-3 text-sm
      `}
    >
      <span>
        {t(messages.unsavedChangesIn, {
          tabs: dirtyTabs.map((tab) => t(tabLabel(tab))).join(', '),
        })}
      </span>
      <div className="flex gap-2">
        <Button onPress={() => form.reset()} isDisabled={isSaving}>
          {t(messages.discard)}
        </Button>
        <Button variant="primary" accent onPress={onSave} isPending={isSaving}>
          {t(messages.save)}
        </Button>
      </div>
    </div>
  );
}

function LeaveDialog({
  form,
  title,
  typePath,
}: {
  form: FormApi<EditableSettings>;
  title: string;
  /** The type's pages: moving between its tabs keeps the changes. */
  typePath: string;
}) {
  const t = useTranslate();
  const isDirty = useDirtyTabs(form).length > 0;
  const blocker = useNavigationBlocker(isDirty, (nextPath) =>
    nextPath.startsWith(`${typePath}/`),
  );
  return (
    <Modal
      isOpen={blocker.isBlocked}
      onOpenChange={(isOpen) => !isOpen && blocker.cancel()}
      isDismissable
    >
      <Dialog
        role="alertdialog"
        className="mx-auto flex w-full flex-col gap-4 p-8"
      >
        <Heading slot="title" className="text-xl font-semibold">
          {t(messages.leaveTitle)}
        </Heading>
        <p className="text-sm">{t(messages.leaveDescription, { title })}</p>
        <div className="flex justify-end gap-2">
          <Button onPress={blocker.cancel}>{t(messages.keepEditing)}</Button>
          <Button
            variant="destructive"
            accent
            onPress={() => {
              form.reset();
              blocker.proceed();
            }}
          >
            {t(messages.discardChanges)}
          </Button>
        </div>
      </Dialog>
    </Modal>
  );
}

interface TypeData {
  type: ContentTypeSettings;
  /** Missing for types that aren't Dexterity types. */
  schema?: TypeSchema;
  types: ContentTypeSummary[];
  workflows: WorkflowInfo[];
  behaviors: BehaviorInfo[];
}

function TypeEditor({
  data,
  tab,
  basePath,
  onSaved,
}: {
  data: TypeData;
  tab: ContentTypeTab;
  basePath: string;
  onSaved: (saved: Pick<TypeData, 'type' | 'schema'>) => void;
}) {
  const t = useTranslate();
  const notify = useNotify();
  const driver = useContentTypesDriver();
  const { capabilities } = driver;
  const { type, types } = data;
  const saved = useMemo(
    () => toEditableSettings(type, data.schema),
    [type, data.schema],
  );
  const form = useFormStore<EditableSettings>({
    key: type.id,
    initialValues: saved,
  });
  const [isSaving, setIsSaving] = useState(false);

  const summary = types.find((entry) => entry.id === type.id);
  const workflow = data.workflows.find(
    (entry) => entry.id === type.workflow?.workflow,
  );

  const onSave = async () => {
    const edited = form.getValues();
    const changes = changedSettings(saved, edited);
    const schema = changedSchema(saved, edited);
    if (!Object.keys(changes).length && !schema) return;
    setIsSaving(true);
    try {
      if (Object.keys(changes).length) {
        await driver.updateType(type.id, changes);
      }
      if (schema) await driver.saveSchema(type.id, schema);
      const [fresh, freshSchema] = await Promise.all([
        driver.getType(type.id),
        data.schema ? driver.getSchema(type.id) : undefined,
      ]);
      form.reset(toEditableSettings(fresh, freshSchema));
      onSaved({ type: fresh, schema: freshSchema });
      notify({
        title: t(messages.updated, { title: fresh.title }),
        variant: 'success',
      });
    } catch (reason) {
      notify({
        title: t(messages.saveError, { title: type.title }),
        description: reason instanceof Error ? reason.message : undefined,
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider form={form}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl font-semibold">{type.title}</h1>
            <span className="font-mono text-sm text-quanta-pigeon">
              {type.id}
            </span>
          </div>
          {type.description && (
            <p className="text-sm text-quanta-pigeon">{type.description}</p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            {capabilities.globalAllow && type.globalAllow !== undefined && (
              <span className="rounded-full border border-quanta-smoke px-2 py-0.5">
                {t(
                  type.globalAllow
                    ? messages.globalAllow
                    : messages.notGloballyAddable,
                )}
              </span>
            )}
            {capabilities.workflows && type.workflow && (
              <span className="rounded-full border border-quanta-smoke px-2 py-0.5">
                {workflow?.title ?? t(messages.noWorkflow)}
                {type.workflow.followsDefault &&
                  ` · ${t(messages.siteDefault)}`}
              </span>
            )}
            {summary && (
              <span className="rounded-full border border-quanta-smoke px-2 py-0.5">
                {t(messages.items, { count: summary.count })}
              </span>
            )}
          </div>
        </header>

        <Tabs
          selectedKey={tab}
          disabledKeys={
            type.kind === 'other' ? ['fields', 'behaviors', 'layout'] : []
          }
        >
          <TabList aria-label={t(messages.tabs)}>
            {TABS.map(([id, label]) => (
              <Tab
                key={id}
                id={id}
                href={contentTypeHref(basePath, type.id, id)}
              >
                {t(label)}
                <DirtyDot form={form} tab={id} />
              </Tab>
            ))}
          </TabList>
          <TabPanel id="settings" className="pt-6">
            <SettingsTab type={type} types={types} />
          </TabPanel>
          <TabPanel id="fields" className="pt-6">
            {data.schema ? (
              <FieldsTab behaviors={data.behaviors} />
            ) : (
              <p className="text-sm text-quanta-pigeon">
                {t(messages.notADexterityType, { title: type.title })}
              </p>
            )}
          </TabPanel>
          <TabPanel id="behaviors" className="pt-6">
            {type.kind === 'other' ? (
              <p className="text-sm text-quanta-pigeon">
                {t(messages.notADexterityType, { title: type.title })}
              </p>
            ) : (
              <BehaviorsTab
                typeId={type.id}
                title={type.title}
                behaviors={data.behaviors}
                schema={data.schema}
                saved={type.behaviors}
              />
            )}
          </TabPanel>
          {TABS.filter(
            ([id]) =>
              id !== 'settings' && id !== 'fields' && id !== 'behaviors',
          ).map(([id]) => (
            <TabPanel key={id} id={id} className="pt-6">
              <p className="text-sm text-quanta-pigeon">
                {type.kind === 'other'
                  ? t(messages.notADexterityType, { title: type.title })
                  : t(messages.comingLater)}
              </p>
            </TabPanel>
          ))}
        </Tabs>

        <SaveBar form={form} isSaving={isSaving} onSave={onSave} />
        <LeaveDialog
          form={form}
          title={type.title}
          typePath={`${basePath}/${encodeURIComponent(type.id)}`}
        />
      </div>
    </FormProvider>
  );
}

/**
 * A type's page: its header and its tabs, each with its own URL. Edits from
 * every tab collect in one form, and a sticky bar saves them together.
 * Leaving with unsaved changes asks first.
 */
export function ContentTypePage({
  id,
  tab = 'settings',
  basePath = CONTENT_TYPES_BASE_PATH,
}: ContentTypePageProps) {
  const t = useTranslate();
  const driver = useContentTypesDriver();
  const { capabilities } = driver;

  const load = useCallback(async (): Promise<TypeData> => {
    const [type, types, workflows, behaviors] = await Promise.all([
      driver.getType(id),
      driver.listTypes(),
      capabilities.workflows && driver.listWorkflows
        ? driver.listWorkflows()
        : Promise.resolve([]),
      // Only names the behaviors of locked fields, so it may fail.
      driver.listBehaviors().catch(() => []),
    ]);
    const schema =
      type.kind === 'other' ? undefined : await driver.getSchema(id);
    return { type, schema, types, workflows, behaviors };
  }, [driver, capabilities, id]);
  const { data, error, isLoading, reload, setData } = useDriverData(load);

  if (error) {
    return (
      <div role="alert" className="flex items-center gap-3 text-sm">
        <span>{t(messages.typeLoadError)}</span>
        <Button onPress={() => void reload()}>{t(messages.retry)}</Button>
      </div>
    );
  }
  if (!data || (isLoading && data.type.id !== id)) {
    return (
      <p className="text-sm text-quanta-pigeon">{t(messages.loadingType)}</p>
    );
  }
  return (
    <TypeEditor
      key={data.type.id}
      data={data}
      tab={tab}
      basePath={basePath}
      onSaved={(saved) =>
        setData((current) => current && { ...current, ...saved })
      }
    />
  );
}
