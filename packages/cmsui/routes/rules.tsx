import {
  data,
  Form,
  redirect,
  RouterContextProvider,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { Container, Link } from '@plone/quanta';
import { useTranslation } from 'react-i18next';

export async function loader({
  request,
  params,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const path = `/${params['*'] || ''}`;
  const { data: result } = await context
    .get(ploneClientContext)
    .getRules({ path });
  return {
    path,
    title: context.get(ploneContentContext).title,
    rules: result['content-rules'],
  };
}

export async function action({
  request,
  params,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const path = `/${params['*'] || ''}`;
  const form = await request.formData();
  const operation = String(form.get('operation') || '');
  const rule = String(form.get('rule') || '');
  if (!rule || rule.includes('/'))
    return data({ error: 'Invalid rule' }, { status: 400 });
  const cli = context.get(ploneClientContext);
  if (operation === 'assign') await cli.createRule({ path, ruleId: rule });
  else if (operation === 'remove')
    await cli.deleteRules({
      path,
      data: { 'form.button.Delete': true, rule_ids: [rule] },
    });
  else if (['Enable', 'Disable', 'Bubble', 'NoBubble'].includes(operation))
    await cli.updateRules({
      path,
      data: { [`form.button.${operation}`]: true, rule_ids: [rule] },
    });
  else return data({ error: 'Invalid operation' }, { status: 400 });
  return redirect(`/@@rules${path === '/' ? '' : path}`);
}

export default function Rules() {
  const { path, title, rules } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const label = (value: string) =>
    t(`cmsui.rules.${value}`, { defaultValue: value });
  return (
    <main>
      <Container width="default">
        <h1>
          {label('Rules')} — {title}
        </h1>
        <Link href={path}>{label('Back to content')}</Link>
        {rules.assignable_rules.length > 0 && (
          <Form method="post">
            <label htmlFor="rule">{label('Available rules')}</label>{' '}
            <select id="rule" name="rule" required>
              {rules.assignable_rules.map(
                (rule: { id: string; title: string }) => (
                  <option key={rule.id} value={rule.id}>
                    {rule.title}
                  </option>
                ),
              )}
            </select>
            <button name="operation" value="assign">
              {label('Assign')}
            </button>
          </Form>
        )}
        <h2>{label('Assigned rules')}</h2>
        {rules.assigned_rules.length === 0 && (
          <p>{label('No rules assigned.')}</p>
        )}
        <ul>
          {rules.assigned_rules.map((rule) => (
            <li key={rule.id}>
              <strong>{rule.title}</strong>
              {' — '}
              {rule.enabled ? label('Enabled') : label('Disabled')}
              {' — '}
              {rule.bubbles
                ? label('Applies to subfolders')
                : label('Does not apply to subfolders')}
              <Form method="post">
                <input type="hidden" name="rule" value={rule.id} />
                <button
                  name="operation"
                  value={rule.enabled ? 'Disable' : 'Enable'}
                >
                  {rule.enabled ? label('Disable') : label('Enable')}
                </button>{' '}
                <button
                  name="operation"
                  value={rule.bubbles ? 'NoBubble' : 'Bubble'}
                >
                  {rule.bubbles
                    ? label('Stop applying to subfolders')
                    : label('Apply to subfolders')}
                </button>{' '}
                <button name="operation" value="remove">
                  {label('Unassign')}
                </button>
              </Form>
            </li>
          ))}
        </ul>
        {rules.acquired_rules.length > 0 && (
          <section>
            <h2>{label('Inherited rules')}</h2>
            <ul>
              {rules.acquired_rules.map(
                (rule: { id: string; title: string }) => (
                  <li key={rule.id}>{rule.title}</li>
                ),
              )}
            </ul>
          </section>
        )}
      </Container>
    </main>
  );
}
