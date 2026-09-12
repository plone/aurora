import { useState, useEffect } from 'react';
import { Form, useFetcher } from 'react-router';
import { useTranslation } from 'react-i18next';
import { VisuallyHidden } from 'react-aria';
import {
  Checkbox,
  Table,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
  SearchField,
  Button,
  Description,
} from '@plone/components/quanta';
import type {
  SharingEntry,
  SharingResponse,
  SharingRole,
  SharingRoleValue,
} from '@plone/types';
import {
  WorldIcon,
  ArrowupIcon,
  UserIcon,
  SocialIcon,
  CheckboxIcon,
} from '@plone/components/Icons';

type UpdatedEntry = {
  id: string;
  type: string;
  roles: Record<string, boolean>;
};

function NameCell({ entry }: { entry: SharingEntry }) {
  const { t } = useTranslation();
  return (
    <Cell>
      <span className="inline-flex items-center">
        {entry.type === 'user' && (
          <UserIcon
            aria-label={t('cmsui.sharing.user')}
            className="me-2 shrink-0"
          />
        )}
        {entry.type === 'group' && (
          <SocialIcon
            aria-label={t('cmsui.sharing.group')}
            className="me-2 shrink-0"
          />
        )}
        {entry.title}
        {entry.login && ` (${entry.login})`}
      </span>
    </Cell>
  );
}

function RoleCell({
  value,
  roleTitle,
  isSelected,
  isDisabled,
  onChange,
}: {
  value: SharingRoleValue | undefined;
  roleTitle: string;
  isSelected: boolean;
  isDisabled: boolean;
  onChange: (isSelected: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Cell>
      {value === 'global' && (
        <WorldIcon
          className="text-quanta-sapphire"
          aria-label={`${roleTitle} — ${t('cmsui.sharing.globalRole')}`}
        />
      )}
      {value === 'acquired' && (
        <ArrowupIcon
          className="text-green-600"
          aria-label={`${roleTitle} — ${t('cmsui.sharing.inheritedValue')}`}
        />
      )}
      {typeof value === 'boolean' && (
        <Checkbox
          isSelected={isSelected}
          isDisabled={isDisabled}
          onChange={onChange}
          aria-label={roleTitle}
        />
      )}
    </Cell>
  );
}

type RoleEdits = Record<string, Record<string, boolean>>;

export function useSharingEdits(originalInherit: boolean, search: string) {
  const [edits, setEdits] = useState<RoleEdits>({});
  const [inherit, setInherit] = useState(originalInherit);

  useEffect(() => {
    setEdits((prev) => (Object.keys(prev).length ? {} : prev));
  }, [search]);

  const isSelected = (entry: SharingEntry, roleId: string): boolean =>
    edits[entry.id]?.[roleId] ?? entry.roles[roleId] === true;

  const toggle = (entry: SharingEntry, roleId: string, selected: boolean) =>
    setEdits((prev) => {
      const entryEdits = { ...prev[entry.id] };
      if (selected === (entry.roles[roleId] === true)) {
        delete entryEdits[roleId];
      } else {
        entryEdits[roleId] = selected;
      }
      const next = { ...prev };
      if (Object.keys(entryEdits).length === 0) {
        delete next[entry.id];
      } else {
        next[entry.id] = entryEdits;
      }
      return next;
    });

  const hasEdits = Object.keys(edits).length > 0 || inherit !== originalInherit;

  const buildChangedEntries = (
    entries: SharingEntry[],
    roles: SharingRole[],
  ): UpdatedEntry[] =>
    entries
      .filter((entry) => edits[entry.id])
      .map((entry) => ({
        id: entry.id,
        type: entry.type,
        roles: Object.fromEntries(
          roles
            .map((role) => role.id)
            .filter((roleId) => typeof entry.roles[roleId] === 'boolean')
            .map((roleId) => [roleId, isSelected(entry, roleId)]),
        ),
      }));

  return {
    isSelected,
    toggle,
    inherit,
    setInherit,
    hasEdits,
    buildChangedEntries,
  };
}

interface SharingFormProps {
  content: { '@id': string; title: string };
  sharingData: SharingResponse;
  search: string;
  currentUserId: string | null;
}

export default function SharingForm({
  content,
  sharingData,
  search,
  currentUserId,
}: SharingFormProps) {
  const { t } = useTranslation();
  const { entries, available_roles, inherit } = sharingData;

  const edits = useSharingEdits(inherit, search);
  const fetcher = useFetcher();
  const isSaving = fetcher.state !== 'idle';

  const handleSave = () => {
    fetcher.submit(
      {
        entries: edits.buildChangedEntries(entries, available_roles),
        inherit: edits.inherit,
      },
      { method: 'post', encType: 'application/json' },
    );
  };

  return (
    <>
      <search>
        <Form>
          <SearchField
            name="search"
            defaultValue={search}
            label={t('cmsui.sharing.searchLabel')}
            placeholder={t('cmsui.sharing.searchPlaceholder')}
            aria-controls="sharing-entries"
          />
        </Form>
      </search>
      <div id="sharing-entries">
        <VisuallyHidden>
          <span aria-live="polite">
            {t('cmsui.sharing.searchResults', { count: entries.length })}
          </span>
        </VisuallyHidden>
        <Table aria-label={t('cmsui.sharing.label', { title: content.title })}>
          <TableHeader>
            <Column id="name" isRowHeader>
              {t('cmsui.sharing.name')}
            </Column>
            {available_roles.map((role) => (
              <Column key={role.id} id={role.id}>
                {role.title}
              </Column>
            ))}
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const isRowDisabled =
                entry.disabled ||
                (entry.type === 'user' && entry.id === currentUserId);
              return (
                <Row key={entry.id} id={entry.id}>
                  <NameCell entry={entry} />
                  {available_roles.map((role) => (
                    <RoleCell
                      key={role.id}
                      value={entry.roles[role.id]}
                      roleTitle={role.title}
                      isSelected={edits.isSelected(entry, role.id)}
                      isDisabled={isRowDisabled}
                      onChange={(selected) =>
                        edits.toggle(entry, role.id, selected)
                      }
                    />
                  ))}
                </Row>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div>
        <Checkbox
          isSelected={edits.inherit}
          onChange={edits.setInherit}
          aria-describedby="inherit-description"
        >
          {t('cmsui.sharing.inherit')}
        </Checkbox>
        <Description id="inherit-description">
          {t('cmsui.sharing.inheritDescription')}
        </Description>
      </div>

      <div>
        <Button
          aria-label={t('cmsui.save')}
          onPress={handleSave}
          variant="primary"
          accent
          size="L"
          isDisabled={!edits.hasEdits || isSaving}
        >
          <CheckboxIcon />
        </Button>
      </div>
    </>
  );
}
