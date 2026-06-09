import {
  data,
  RouterContextProvider,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { HandleCatchedError } from '../helpers/Errors';
import { settleItems } from '../helpers/batch';
import { commonTransitions, type Transition } from '../helpers/workflow';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const cli = context.get(ploneClientContext);

  const paths = new URL(request.url).searchParams.getAll('path');
  let transitions: ReturnType<typeof commonTransitions> = [];
  const states: Array<{ id: string; title: string }> = [];

  try {
    const results = await Promise.allSettled(
      paths.map((path) => cli.getWorkflow({ path })),
    );
    const perItem: Transition[][] = [];
    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        perItem.push(
          (r.value.data.transitions ?? []) as unknown as Transition[],
        );
        if (r.value.data.state) {
          states.push(r.value.data.state);
        }
      }
    });
    transitions = commonTransitions(perItem);
  } catch (e) {
    HandleCatchedError(e, 'Error loading workflow transitions');
  }

  return data({ transitions, states }, 200);
}

interface WorkflowPayload {
  items: Array<{ '@id': string; title: string }>;
  transition: string;
  comment?: string;
  include_children?: boolean;
}

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const cli = context.get(ploneClientContext);
  const payload: WorkflowPayload = await request.json();

  const { ok, errors } = await settleItems(
    payload.items,
    (item) =>
      cli.createWorkflow({
        path: item['@id'],
        transition: payload.transition,
        data: {
          comment: payload.comment || undefined,
          include_children: payload.include_children || undefined,
        },
      }),
    'Error on workflow transition',
  );

  return data({ ok, errors }, 200);
}
