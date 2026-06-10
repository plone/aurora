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
import { flattenToAppURL } from '@plone/helpers';
import { useTranslation } from 'react-i18next';
import {
  Checkbox,
  Container,
  Table,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
  TextField,
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

  return data(
    flattenToAppURL({
      content,
      sharingData,
      search,
      currentUserId: user?.id ?? null,
    }),
  );
}

/** Minimal entry shape accepted by the `@sharing` POST. */
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
  const path = `/${params['*'] || ''}`;

  const { entries } = (await request.json()) as { entries: UpdatedEntry[] };

  await cli.updateSharing({ path, data: { entries } });

  return redirect(path);
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

/** Pending role changes, keyed by entry id then role id. */
type RoleEdits = Record<string, Record<string, boolean>>;

/**
 * Owns the pending checkbox edits as a thin overlay on top of the loader's
 * entries: only changed roles are tracked, so detecting reverts and building
 * the save payload stay trivial. Pass the active search term as `resetKey` so
 * edits are discarded whenever a new search re-fetches the entries.
 */
function useSharingEdits(resetKey: string) {
  const [edits, setEdits] = useState<RoleEdits>({});

  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setEdits({});
  }

  const isSelected = (entry: SharingEntry, roleId: string): boolean =>
    edits[entry.id]?.[roleId] ?? entry.roles[roleId] === true;

  const toggle = (entry: SharingEntry, roleId: string, selected: boolean) =>
    setEdits((prev) => {
      const entryEdits = { ...prev[entry.id] };
      // Reverting to the original value clears the pending edit.
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

  const hasEdits = Object.keys(edits).length > 0;

  // The `@sharing` POST payload: only changed entries, each carrying its full
  // boolean role map (read-only 'global'/'acquired' sentinels excluded).
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

  return { isSelected, toggle, hasEdits, buildChangedEntries };
}

export default function Sharing() {
  const { content, sharingData, search, currentUserId } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const { entries, available_roles, inherit } = sharingData;

  const edits = useSharingEdits(search);
  const fetcher = useFetcher();
  const isSaving = fetcher.state !== 'idle';

  const handleSave = () => {
    fetcher.submit(
      { entries: edits.buildChangedEntries(entries, available_roles) },
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
      <Form role="search">
        <TextField
          key={search}
          type="search"
          name="search"
          defaultValue={search}
          label={t('cmsui.sharing.searchLabel')}
          placeholder={t('cmsui.sharing.searchPlaceholder')}
        />
      </Form>
      <Table aria-label={t('cmsui.sharing.label')}>
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
            const isOwnRow =
              entry.type === 'user' && entry.id === currentUserId;
            return (
              <Row key={entry.id} id={entry.id}>
                <NameCell entry={entry} />
                {available_roles.map((role) => (
                  <RoleCell
                    key={role.id}
                    value={entry.roles[role.id]}
                    roleTitle={role.title}
                    isSelected={edits.isSelected(entry, role.id)}
                    isDisabled={isOwnRow}
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

      <div>
        <Checkbox isSelected={inherit}>{t('cmsui.sharing.inherit')}</Checkbox>
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
