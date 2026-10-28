import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ControlPanelsProvider } from '../../../provider/ControlPanelsProvider';
import { ContentTypesDriverProvider, NO_CAPABILITIES } from '../../driver';
import { createMockDriver } from '../../mock/createMockDriver';
import { ContentTypePage } from '../ContentTypePage/ContentTypePage';

function renderWorkflow(driver = createMockDriver({ jobSteps: 1 })) {
  const notify = vi.fn();
  render(
    <ControlPanelsProvider navigate={vi.fn()} notify={notify}>
      <ContentTypesDriverProvider driver={driver}>
        <ContentTypePage id="Document" tab="workflow" />
      </ContentTypesDriverProvider>
    </ControlPanelsProvider>,
  );
  return { driver, notify };
}

const dialog = () =>
  screen.findByRole('dialog', { name: 'Change workflow for Page' });

async function openAndChoose(name: RegExp) {
  fireEvent.click(
    await screen.findByRole('button', { name: 'Change workflow…' }),
  );
  const view = within(await dialog());
  expect(
    view.getByRole('radio', { name: /Follow the site default/ }),
  ).toBeDisabled();
  fireEvent.click(view.getByRole('radio', { name }));
  await act(async () => {
    fireEvent.click(view.getByRole('button', { name: 'Next: map states' }));
  });
  return view;
}

describe('WorkflowTab', () => {
  it('shows the states of the current workflow', async () => {
    renderWorkflow();
    const states = await screen.findByRole('list', { name: 'States' });
    expect(within(states).getAllByRole('listitem')).toHaveLength(3);
    expect(within(states).getAllByRole('listitem')[2]).toHaveTextContent(
      'PublishedAnyoneRetract → Private',
    );
    expect(screen.getByText('Follows the site default')).toBeVisible();
    expect(screen.getByText('New items start here')).toBeVisible();
  });

  it('maps states, keeping who sees the items, and changes the workflow', async () => {
    const { driver, notify } = renderWorkflow();
    const changeWorkflow = vi.spyOn(driver, 'changeWorkflow');
    const view = await openAndChoose(/Intranet\/Extranet Workflow/);

    const mapping = () => view.findByRole('list', { name: 'Map states' });
    const rows = within(await mapping()).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Private');
    expect(rows[0]).toHaveTextContent('Same visibility');
    expect(rows[1]).toHaveTextContent('No items in this state');
    expect(rows[2]).toHaveTextContent('2 items');
    expect(
      within(rows[2]).getByRole('button', { name: /New state for Published/ }),
    ).toHaveTextContent('Externally visible');

    // Choosing a less visible state warns.
    fireEvent.click(
      within(rows[2]).getByRole('button', { name: /New state for Published/ }),
    );
    fireEvent.click(
      await screen.findByRole('option', { name: /Internally published/ }),
    );
    expect(
      await view.findByText('Some items will be less visible.'),
    ).toBeVisible();
    expect(
      within(await mapping()).getAllByRole('listitem')[2],
    ).toHaveTextContent('Less visible: logged-in members only');

    fireEvent.click(view.getByRole('button', { name: 'Next: review' }));
    expect(
      view.getByText(
        'Page will use Intranet/Extranet Workflow instead of Simple Publication Workflow.',
      ),
    ).toBeVisible();
    expect(
      view.getByText(
        '2 items: Published → Internally published. Now visible only to logged-in members (was anyone).',
      ),
    ).toBeVisible();
    await act(async () => {
      fireEvent.click(
        view.getByRole('button', { name: 'Change workflow for 3 items' }),
      );
    });

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith({
        title: 'Page now uses Intranet/Extranet Workflow.',
        description: '3 items updated.',
        variant: 'success',
      }),
    );
    expect(changeWorkflow.mock.calls[0][0]).toEqual({
      types: ['Document'],
      workflow: 'intranet_workflow',
      followDefault: undefined,
      stateMap: {
        simple_publication_workflow: {
          private: 'private',
          pending: 'private',
          published: 'internally_published',
        },
      },
    });
    expect(
      await screen.findByRole('heading', {
        name: 'Intranet/Extranet Workflow',
      }),
    ).toBeVisible();
    expect(screen.getByText('Set for this type')).toBeVisible();
  });

  it('explains that no workflow has nothing to map', async () => {
    renderWorkflow();
    const view = await openAndChoose(/^No workflow/);
    expect(
      await view.findByText(
        'No workflow has no states, so there is nothing to map.',
      ),
    ).toBeVisible();
    expect(
      view.getAllByText('Visibility then depends on the folder'),
    ).toHaveLength(2);
    fireEvent.click(view.getByRole('button', { name: 'Next: review' }));
    expect(
      view.getByText(
        '2 items: Items will take their visibility from their folder.',
      ),
    ).toBeVisible();
  });

  it("says what's missing on a basic backend", async () => {
    renderWorkflow(createMockDriver({ capabilities: NO_CAPABILITIES }));
    expect(
      await screen.findByText(
        "This site's backend doesn't tell which workflow a type uses yet.",
      ),
    ).toBeVisible();
    renderWorkflow(
      createMockDriver({ capabilities: { workflowChange: false } }),
    );
    expect(
      await screen.findByText('Changing the workflow needs a newer backend.'),
    ).toBeVisible();
  });
});
