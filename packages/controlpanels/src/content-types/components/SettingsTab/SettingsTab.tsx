import type { ReactNode } from 'react';
import { useSchemaField } from '@plone/helpers';
import {
  MultiSelect,
  Radio,
  RadioGroup,
  Switch,
  TextAreaField,
  TextField,
} from '@plone/quanta';
import { useTranslate } from '../../../provider/ControlPanelsProvider';
import { useContentTypesDriver } from '../../driver';
import { messages } from '../../messages';
import type {
  AllowedContents,
  ContentTypeSettings,
  ContentTypeSummary,
  VersioningPolicy,
} from '../../types';

export interface SettingsTabProps {
  /** The saved settings: what kind of type it is, its short name. */
  type: ContentTypeSettings;
  /** Every type, to pick the ones allowed inside this one. */
  types: ContentTypeSummary[];
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`
        grid gap-4 border-b border-quanta-smoke pb-6
        last:border-b-0 last:pb-0
        md:grid-cols-[minmax(10rem,14rem)_1fr] md:gap-6
      `}
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-quanta-pigeon">{description}</p>
        )}
      </header>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  );
}

function SettingSwitch({
  path,
  label,
  description,
}: {
  path: string;
  label: string;
  description?: string;
}) {
  const field = useSchemaField<boolean>(path);
  return (
    <Switch
      isSelected={!!field.value}
      onChange={field.onChange}
      description={description}
    >
      {label}
    </Switch>
  );
}

function GeneralSection({ type }: { type: ContentTypeSettings }) {
  const t = useTranslate();
  const title = useSchemaField<string>('title');
  const description = useSchemaField<string>('description');
  return (
    <Section title={t(messages.general)} description={t(messages.generalHelp)}>
      <TextField
        label={t(messages.name)}
        value={title.value ?? ''}
        onChange={title.onChange}
        onBlur={title.onBlur}
        isRequired
        isInvalid={title.meta.touched && !title.value?.trim()}
      />
      <TextAreaField
        label={t(messages.typeDescription)}
        value={description.value ?? ''}
        onChange={description.onChange}
        onBlur={description.onBlur}
      />
      <TextField label={t(messages.shortName)} value={type.id} isReadOnly />
    </Section>
  );
}

function ContentsSection({ types }: { types: ContentTypeSummary[] }) {
  const t = useTranslate();
  const field = useSchemaField<AllowedContents>('allowedContents');
  const value = field.value ?? { mode: 'all' };
  const items = types
    .filter((type) => type.kind === 'dexterity')
    .map((type) => ({ id: type.id, name: type.title }));
  const selected = value.mode === 'selected' ? value.types : [];
  return (
    <Section
      title={t(messages.contents)}
      description={t(messages.contentsHelp)}
    >
      <RadioGroup
        label={t(messages.allowedInside)}
        value={value.mode}
        onChange={(mode) =>
          field.onChange(
            mode === 'selected'
              ? { mode: 'selected', types: selected }
              : { mode: mode as 'all' | 'none' },
          )
        }
      >
        <Radio value="all">{t(messages.allowAll)}</Radio>
        <Radio value="selected">{t(messages.allowSelected)}</Radio>
        <Radio value="none">{t(messages.allowNone)}</Radio>
      </RadioGroup>
      {value.mode === 'selected' && (
        <MultiSelect
          label={t(messages.allowedTypes)}
          placeholder={t(messages.addAllowedType)}
          items={items}
          value={items.filter((item) => selected.includes(item.id))}
          onChange={(chosen) =>
            field.onChange({
              mode: 'selected',
              types: chosen.map((item) => item.id),
            })
          }
        />
      )}
    </Section>
  );
}

function VersioningSection() {
  const t = useTranslate();
  const field = useSchemaField<VersioningPolicy>('versioning');
  return (
    <Section
      title={t(messages.versioning)}
      description={t(messages.versioningHelp)}
    >
      <RadioGroup
        aria-label={t(messages.versioning)}
        value={field.value ?? 'off'}
        onChange={(value) => field.onChange(value as VersioningPolicy)}
      >
        <Radio value="off" description={t(messages.versioningOffHelp)}>
          {t(messages.versioningOff)}
        </Radio>
        <Radio value="manual" description={t(messages.versioningManualHelp)}>
          {t(messages.versioningManual)}
        </Radio>
        <Radio
          value="automatic"
          description={t(messages.versioningAutomaticHelp)}
        >
          {t(messages.versioningAutomatic)}
        </Radio>
      </RadioGroup>
    </Section>
  );
}

/**
 * A type's general settings, written as sentences. Sections the driver
 * can't provide are left out, with one note that says so.
 */
export function SettingsTab({ type, types }: SettingsTabProps) {
  const t = useTranslate();
  const { capabilities } = useContentTypesDriver();
  const isDexterity = type.kind === 'dexterity';
  const missing =
    !capabilities.globalAllow ||
    !capabilities.searchable ||
    !capabilities.defaultPage ||
    !capabilities.allowDiscussion ||
    !capabilities.versioning;

  return (
    <div className="flex flex-col gap-6">
      <GeneralSection type={type} />
      {capabilities.globalAllow && isDexterity && (
        <Section title={t(messages.whereAdded)}>
          <SettingSwitch
            path="globalAllow"
            label={t(messages.globalAllow)}
            description={t(messages.globalAllowHelp)}
          />
        </Section>
      )}
      {type.folderish && <ContentsSection types={types} />}
      {(capabilities.searchable || capabilities.defaultPage) && (
        <Section title={t(messages.visibility)}>
          {capabilities.searchable && (
            <SettingSwitch
              path="searchable"
              label={t(messages.searchable)}
              description={t(messages.searchableHelp)}
            />
          )}
          {capabilities.defaultPage && (
            <SettingSwitch
              path="defaultPage"
              label={t(messages.defaultPage)}
              description={t(messages.defaultPageHelp)}
            />
          )}
        </Section>
      )}
      {capabilities.allowDiscussion && (
        <Section title={t(messages.comments)}>
          <SettingSwitch
            path="allowDiscussion"
            label={t(messages.allowDiscussion)}
          />
        </Section>
      )}
      {capabilities.versioning && <VersioningSection />}
      {missing && (
        <p className="text-sm text-quanta-pigeon">
          {t(messages.moreSettingsLater)}
        </p>
      )}
    </div>
  );
}
