import config from '@plone/registry';
import type { Content } from '@plone/types';
import type { MoreMenuProps } from '../components/Toolbar/MoreMenu/MoreMenu';
import { shouldShowToolbar } from './index';

/** The calls of the Plone client that `getMoreMenuData` makes. */
interface MoreMenuClient {
  getWorkflow: (args: { path: string }) => Promise<{ data: unknown }>;
  getType: (args: {
    type: string;
  }) => Promise<{ data: { layouts?: string[] | null } }>;
}

/**
 * Loads the data the toolbar `MoreMenu` needs besides the content: the
 * workflow state and transitions, and the layouts the content can switch to.
 * Call it from a route loader.
 */
export async function getMoreMenuData(
  cli: MoreMenuClient,
  content: Content,
): Promise<Pick<MoreMenuProps, 'workflow' | 'layouts'>> {
  const canEdit = shouldShowToolbar(content);
  const [workflowResult, typeResult] =
    canEdit && (content['@type'] as string) !== 'Plone Site'
      ? await Promise.all([
          cli.getWorkflow({ path: content['@id'] }).catch(() => null),
          cli.getType({ type: content['@type'] }).catch(() => null),
        ])
      : [null, null];
  const workflow = workflowResult?.data as MoreMenuProps['workflow'];
  const layouts = (typeResult?.data.layouts ?? []).filter(
    (layout) => layout in config.views.layoutViews,
  );
  return { workflow, layouts };
}
