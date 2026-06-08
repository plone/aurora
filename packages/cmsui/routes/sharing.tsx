import type { LoaderFunctionArgs } from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { data, RouterContextProvider, useLoaderData } from 'react-router';
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
} from '@plone/components/quanta';
import type { SharingRoleValue } from '@plone/types';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const contentPath = content?.['@id'] ?? '/';

  const { data: sharingData } = await cli.getSharing({ path: contentPath });

  return data(flattenToAppURL({ content, sharingData }));
}

/**
 * Read-only rendering of a single role cell as a checkbox.
 * A boolean value is an assignable role; the `'global'` / `'acquired'`
 * sentinels are read-only and managed elsewhere (site admin / parent),
 * so they render as checked checkboxes with a color cue and title.
 */
function RoleCell({
  value,
  roleTitle,
}: {
  value: SharingRoleValue | undefined;
  roleTitle: string;
}) {
  const { t } = useTranslation();
  const isGlobal = value === 'global';
  const isAcquired = value === 'acquired';
  const title = isGlobal
    ? t('cmsui.sharing.globalRole')
    : isAcquired
      ? t('cmsui.sharing.inheritedValue')
      : undefined;

  return (
    <Cell>
      <Checkbox
        isSelected={value === true || isGlobal || isAcquired}
        aria-label={title ? `${roleTitle} (${title})` : roleTitle}
        className={
          isGlobal
            ? 'text-quanta-sapphire'
            : isAcquired
              ? 'text-green-600'
              : undefined
        }
      />
    </Cell>
  );
}

export default function Sharing() {
  const { content, sharingData } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const { entries, available_roles, inherit } = sharingData;

  return (
    <Container id="page-sharing">
      <h1>
        {t('cmsui.sharing.label')}: {content.title}
      </h1>
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
              <Cell>
                {entry.title}
                {entry.login && ` (${entry.login})`}
              </Cell>
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

      <p>
        <Checkbox isSelected={inherit}>{t('cmsui.sharing.inherit')}</Checkbox>
      </p>
    </Container>
  );
}
