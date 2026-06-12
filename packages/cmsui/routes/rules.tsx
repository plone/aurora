import { useEffect, useState } from 'react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { flattenToAppURL } from '@plone/helpers';
import { requireAuthCookie } from '@plone/react-router';
import {
  data,
  RouterContextProvider,
  useFetcher,
  useLoaderData,
} from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { useTranslation } from 'react-i18next';
import type { Selection } from 'react-aria-components';
import {
  Button,
  Container,
  Table,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
  Select,
  Link,
} from '@plone/components/quanta';
import type { AssignedRule } from '@plone/types';
import {
  CheckboxIcon,
  ChevrondownIcon,
  ChevronupIcon,
  CloseIcon,
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
  const path = `/${params['*'] || ''}`;

  const { data: rulesData } = await cli.getRules({ path });

  return data(
    flattenToAppURL({
      content: { '@id': content['@id'], title: content.title },
      rules: rulesData['content-rules'],
    }),
  );
}

type RulesOperation =
  | { operation: 'assign'; rule_id: string }
  | { operation: 'move'; rule_id: string; direction: 'up' | 'down' }
  | {
      operation:
        | 'unassign'
        | 'enable'
        | 'disable'
        | 'apply_subfolders'
        | 'unapply_subfolders';
      rule_ids: string[];
    };

export async function action({
  request,
  params,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const path = `/${params['*'] || ''}`;

  const body: RulesOperation = await request.json();

  try {
    switch (body.operation) {
      case 'assign':
        await cli.createRule({ path, ruleId: body.rule_id });
        break;
      case 'move':
        await cli.moveRule({
          path,
          ruleId: body.rule_id,
          direction: body.direction,
        });
        break;
      case 'unassign':
        await cli.deleteRules({ path, ruleIds: body.rule_ids });
        break;
      case 'enable':
        await cli.enableRules({ path, ruleIds: body.rule_ids });
        break;
      case 'disable':
        await cli.disableRules({ path, ruleIds: body.rule_ids });
        break;
      case 'apply_subfolders':
        await cli.applyRulesToSubfolders({ path, ruleIds: body.rule_ids });
        break;
      case 'unapply_subfolders':
        await cli.unapplyRulesToSubfolders({ path, ruleIds: body.rule_ids });
        break;
      default:
        return data({ error: 'invalidOperation' }, { status: 400 });
    }
  } catch (error: any) {
    const message = error?.data?.message || error?.message || undefined;
    return data({ message }, { status: Number(error?.status) || 500 });
  }

  return data({ ok: true as const, operation: body.operation });
}

function EnabledMark({ value }: { value: boolean }) {
  const { t } = useTranslation();
  return value ? (
    <>
      <CheckboxIcon className="text-quanta-emerald" aria-hidden="true" />
      <span className="sr-only">{t('cmsui.yes')}</span>
    </>
  ) : (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{t('cmsui.no')}</span>
    </>
  );
}

function AssignRule({
  assignableRules,
  isSaving,
  value,
  onChange,
  onAssign,
}: {
  assignableRules: { id: string; title: string }[];
  isSaving: boolean;
  value: string | null;
  onChange: (ruleId: string | null) => void;
  onAssign: (ruleId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="my-4 flex items-end gap-2">
      <Select
        value={value}
        label={t('cmsui.rules.availableRules')}
        placeholder={t('cmsui.rules.selectRule')}
        items={assignableRules.map((rule) => ({
          value: rule.id,
          label: rule.title,
        }))}
        onChange={(selected) => onChange((selected as string) ?? null)}
      />
      <Button
        variant="primary"
        isDisabled={!value || isSaving}
        onPress={() => value && onAssign(value)}
      >
        {t('cmsui.add')}
      </Button>
    </div>
  );
}

export default function Rules() {
  const { content, rules } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const { acquired_rules, assignable_rules, assigned_rules } = rules;

  const [selectedRules, setSelectedRules] = useState<Selection>(new Set());
  const [newRule, setNewRule] = useState<string | null>(null);
  const fetcher = useFetcher<typeof action>();
  const isSaving = fetcher.state !== 'idle';
  const failure = fetcher.data && !('ok' in fetcher.data) ? fetcher.data : null;

  // Keep the selection on failure so the user can retry; clear it only once
  // the operation has succeeded.
  useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data || !('ok' in fetcher.data)) {
      return;
    }
    if (fetcher.data.operation === 'assign') {
      setNewRule(null);
    } else if (fetcher.data.operation !== 'move') {
      setSelectedRules(new Set());
    }
  }, [fetcher.state, fetcher.data]);

  const selectedRuleIds =
    selectedRules === 'all'
      ? assigned_rules.map((rule) => rule.id)
      : [...selectedRules].map(String);

  const submit = (body: RulesOperation) => {
    fetcher.submit(body, { method: 'post', encType: 'application/json' });
  };

  const operationButtons = [
    { operation: 'enable', label: t('cmsui.rules.enable') },
    { operation: 'disable', label: t('cmsui.rules.disable') },
    {
      operation: 'apply_subfolders',
      label: t('cmsui.rules.applyToSubfolders'),
    },
    {
      operation: 'unapply_subfolders',
      label: t('cmsui.rules.unapplyToSubfolders'),
    },
  ] as const;

  return (
    <Container id="page-rules">
      <Plug
        pluggable="toolbar-top"
        id="button-cancel"
        // @ts-expect-error this is currently typed as never[]
        dependencies={[content['@id']]}
      >
        <Link aria-label={t('cmsui.cancel')} href={content['@id']}>
          <CloseIcon />
        </Link>
      </Plug>
      <h1>{t('cmsui.rules.label', { title: content.title })}</h1>
      <p>{t('cmsui.rules.description')}</p>
      {failure && (
        <p role="alert" className="text-sm text-quanta-candy">
          {'error' in failure
            ? t('cmsui.rules.invalidOperation')
            : failure.message || t('cmsui.rules.requestFailed')}
        </p>
      )}

      {acquired_rules.length > 0 && (
        <Table aria-label={t('cmsui.rules.acquiredRules')}>
          <TableHeader>
            <Column id="title" isRowHeader>
              {t('cmsui.rules.acquiredRules')}
            </Column>
            <Column id="enabled">{t('cmsui.rules.active')}</Column>
          </TableHeader>
          <TableBody>
            {acquired_rules.map((rule) => (
              <Row key={rule.id} id={rule.id}>
                <Cell>
                  {rule.title}
                  {rule.trigger && ` (${rule.trigger})`}
                </Cell>
                <Cell>
                  <EnabledMark value={rule.enabled} />
                </Cell>
              </Row>
            ))}
          </TableBody>
        </Table>
      )}

      {assignable_rules.length > 0 && (
        <AssignRule
          assignableRules={assignable_rules}
          isSaving={isSaving}
          value={newRule}
          onChange={setNewRule}
          onAssign={(ruleId) =>
            submit({ operation: 'assign', rule_id: ruleId })
          }
        />
      )}

      {assigned_rules.length > 0 ? (
        <>
          <Table
            aria-label={t('cmsui.rules.assignedRules')}
            selectionMode="multiple"
            selectionBehavior="toggle"
            selectedKeys={selectedRules}
            onSelectionChange={setSelectedRules}
          >
            <TableHeader>
              <Column id="title" isRowHeader>
                {t('cmsui.rules.assignedRules')}
              </Column>
              <Column id="bubbles">
                {t('cmsui.rules.appliesToSubfolders')}
              </Column>
              <Column id="enabled">{t('cmsui.rules.enabledHere')}</Column>
              <Column id="global_enabled">
                {t('cmsui.rules.enabledGlobally')}
              </Column>
              <Column id="order">{t('cmsui.rules.order')}</Column>
            </TableHeader>
            <TableBody>
              {assigned_rules.map((rule: AssignedRule, index: number) => (
                <Row key={rule.id} id={rule.id}>
                  <Cell>
                    {rule.title}
                    {rule.trigger && ` (${rule.trigger})`}
                  </Cell>
                  <Cell>
                    <EnabledMark value={rule.bubbles} />
                  </Cell>
                  <Cell>
                    <EnabledMark value={rule.enabled} />
                  </Cell>
                  <Cell>
                    <EnabledMark value={rule.global_enabled} />
                  </Cell>
                  <Cell>
                    <Button
                      variant="icon"
                      aria-label={t('cmsui.rules.moveUp', {
                        title: rule.title,
                      })}
                      isDisabled={isSaving || index === 0}
                      onPress={() =>
                        submit({
                          operation: 'move',
                          rule_id: rule.id,
                          direction: 'up',
                        })
                      }
                    >
                      <ChevronupIcon />
                    </Button>
                    <Button
                      variant="icon"
                      aria-label={t('cmsui.rules.moveDown', {
                        title: rule.title,
                      })}
                      isDisabled={
                        isSaving || index === assigned_rules.length - 1
                      }
                      onPress={() =>
                        submit({
                          operation: 'move',
                          rule_id: rule.id,
                          direction: 'down',
                        })
                      }
                    >
                      <ChevrondownIcon />
                    </Button>
                  </Cell>
                </Row>
              ))}
            </TableBody>
          </Table>
          <div className="my-4 flex flex-wrap gap-2">
            {operationButtons.map(({ operation, label }) => (
              <Button
                key={operation}
                variant="primary"
                isDisabled={selectedRuleIds.length === 0 || isSaving}
                onPress={() => submit({ operation, rule_ids: selectedRuleIds })}
              >
                {label}
              </Button>
            ))}
            <Button
              variant="destructive"
              isDisabled={selectedRuleIds.length === 0 || isSaving}
              onPress={() =>
                submit({ operation: 'unassign', rule_ids: selectedRuleIds })
              }
            >
              {t('cmsui.rules.unassign')}
            </Button>
          </div>
        </>
      ) : (
        <p>{t('cmsui.rules.noAssignedRules')}</p>
      )}
    </Container>
  );
}
