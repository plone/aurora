import type { LoaderFunctionArgs } from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { data, Form, RouterContextProvider, useLoaderData } from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
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
} from '@plone/components/quanta';
import type { SharingEntry, SharingRoleValue } from '@plone/types';
import {
  WorldIcon,
  ArrowupIcon,
  UserIcon,
  SocialIcon,
  CloseIcon,
} from '@plone/components/Icons';
import { Plug } from '@plone/layout/components/Pluggable';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const contentPath = content?.['@id'] ?? '/';

  const search = new URL(request.url).searchParams.get('search') ?? '';

  const { data: sharingData } = await cli.getSharing({
    path: contentPath,
    search,
  });

  return data(flattenToAppURL({ content, sharingData, search }));
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
}: {
  value: SharingRoleValue | undefined;
  roleTitle: string;
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
        <Checkbox isSelected={value} aria-label={roleTitle} />
      )}
    </Cell>
  );
}

export default function Sharing() {
  const { content, sharingData, search } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const { entries, available_roles, inherit } = sharingData;

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
          {entries.map((entry) => (
            <Row key={entry.id} id={entry.id}>
              <NameCell entry={entry} />
              {available_roles.map((role) => (
                <RoleCell
                  key={role.id}
                  value={entry.roles[role.id]}
                  roleTitle={role.title}
                />
              ))}
            </Row>
          ))}
        </TableBody>
      </Table>

      <div>
        <Checkbox isSelected={inherit}>{t('cmsui.sharing.inherit')}</Checkbox>
      </div>
    </Container>
  );
}
