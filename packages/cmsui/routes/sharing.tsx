import { useState } from 'react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import {
  data,
  Form,
  redirect,
  RouterContextProvider,
  useFetcher,
  useLoaderData,
} from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';
import { useTranslation } from 'react-i18next';
import { VisuallyHidden } from 'react-aria';
import {
  Checkbox,
  Container,
  Table,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
  SearchField,
  Link,
  Button,
} from '@plone/components/quanta';
import type { SharingEntry, SharingRole, SharingRoleValue } from '@plone/types';
import {
  WorldIcon,
  ArrowupIcon,
  UserIcon,
  SocialIcon,
  CloseIcon,
  CheckboxIcon,
} from '@plone/components/Icons';
import { Plug } from '@plone/layout/components/Pluggable';

export async function loader({
  request,
  params,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const user = context.get(ploneUserContext);
  const path = `/${params['*'] || ''}`;

  const search = new URL(request.url).searchParams.get('search') ?? '';

  const { data: sharingData } = await cli.getSharing({ path, search });

  return data({
    content: { '@id': content['@id'], title: content.title },
    sharingData,
    search,
    currentUserId: user?.id ?? null,
  });
}

type UpdatedEntry = {
  id: string;
  type: string;
  roles: Record<string, boolean>;
};

export async function action({
  request,
  params,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const path = `/${params['*'] || ''}`;

  const { entries, inherit } = (await request.json()) as {
    entries: UpdatedEntry[];
    inherit: boolean;
  };

  await cli.updateSharing({ path, data: { entries, inherit } });

  return redirect(content['@id']);
}

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

function useSharingEdits(resetKey: string, originalInherit: boolean) {
  const [edits, setEdits] = useState<RoleEdits>({});
  const [inherit, setInherit] = useState(originalInherit);

  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setEdits({});
    setInherit(originalInherit);
  }

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

export default function Sharing() {
  const { content, sharingData, search, currentUserId } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const { entries, available_roles, inherit } = sharingData;

  const edits = useSharingEdits(`${content['@id']}|${search}`, inherit);
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
    <Container id="page-sharing">
      <Plug
        pluggable="toolbar-top"
        id="button-cancel"
        dependencies={[content['@id']] as any}
      >
        <Link aria-label={t('cmsui.sharing.cancel')} href={content['@id']}>
          <CloseIcon />
        </Link>
      </Plug>
      <h1>{t('cmsui.sharing.label', { title: content.title })}</h1>
      <search>
        <Form>
          <SearchField
            key={search}
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
        <Checkbox isSelected={edits.inherit} onChange={edits.setInherit}>
          {t('cmsui.sharing.inherit')}
        </Checkbox>
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
    </Container>
  );
}
