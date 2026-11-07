import { createMockDriver } from './createMockDriver';

describe('createMockDriver', () => {
  it('lists the fixture types with their item counts', async () => {
    const driver = createMockDriver();
    const types = await driver.listTypes();
    expect(types.map((type) => type.id)).toContain('Event');
    expect(types.find((type) => type.id === 'Document')).toMatchObject({
      count: 3,
      globalAllow: true,
      workflow: {
        workflow: 'simple_publication_workflow',
        followsDefault: true,
      },
    });
  });

  it('leaves out what a capability turns off', async () => {
    const driver = createMockDriver({
      capabilities: {
        globalAllow: false,
        workflows: false,
        workflowChange: false,
      },
    });
    const [type] = await driver.listTypes();
    expect(type).not.toHaveProperty('globalAllow');
    expect(type).not.toHaveProperty('workflow');
    expect(driver.listWorkflows).toBeUndefined();
    expect(driver.changeWorkflow).toBeUndefined();
    expect(await driver.getType('Event')).not.toHaveProperty('globalAllow');
  });

  it('keeps its own copy of the data', async () => {
    const first = createMockDriver();
    await first.updateType('Event', { title: 'Happening' });
    expect((await first.getType('Event')).title).toBe('Happening');
    expect((await createMockDriver().getType('Event')).title).toBe('Event');
  });

  it('creates a type with a short name derived from its title', async () => {
    const driver = createMockDriver();
    const type = await driver.createType({ title: 'Meeting minutes' });
    expect(type.id).toBe('meeting_minutes');
    expect((await driver.getSchema('meeting_minutes')).fieldsets).toHaveLength(
      1,
    );
    await expect(
      driver.createType({ title: 'Meeting minutes' }),
    ).rejects.toThrow('already exists');
  });

  it('copies fields, behaviors and settings from another type', async () => {
    const driver = createMockDriver();
    await driver.createType({ title: 'Webinar', copyFrom: 'Event' });
    const copy = await driver.getType('webinar');
    expect(copy.behaviors).toEqual((await driver.getType('Event')).behaviors);
    expect(
      Object.keys((await driver.getSchema('webinar')).properties),
    ).toContain('start');
  });

  it("doesn't delete types that have items, or the site", async () => {
    const driver = createMockDriver();
    await expect(driver.deleteType('Document')).rejects.toThrow('has items');
    await expect(driver.deleteType('Plone Site')).rejects.toThrow(
      "can't be deleted",
    );
    await driver.deleteType('Link');
    expect((await driver.listTypes()).map((type) => type.id)).not.toContain(
      'Link',
    );
  });

  it('says which fields each behavior adds', async () => {
    const behaviors = await createMockDriver().listBehaviors();
    expect(
      behaviors.find((behavior) => behavior.name === 'plone.eventbasic'),
    ).toMatchObject({
      fieldsets: [
        {
          id: 'default',
          fields: ['start', 'end', 'whole_day', 'open_end', 'sync_uid'],
        },
      ],
    });
    // Also for behaviors no fixture type has enabled.
    expect(
      behaviors.find((behavior) => behavior.name === 'plone.leadimage')
        ?.fieldsets,
    ).toEqual([
      { id: 'default', title: 'Default', fields: ['image', 'image_caption'] },
    ]);
    expect(
      behaviors.find((behavior) => behavior.name === 'plone.locking')
        ?.fieldsets,
    ).toEqual([]);
  });

  it('lists add-on behaviors like core ones', async () => {
    const behaviors = await createMockDriver().listBehaviors();
    expect(
      behaviors.find((behavior) => behavior.name === 'collective.sponsors'),
    ).toMatchObject({ title: 'Sponsors' });
  });

  it('leaves out behavior fields without the capability', async () => {
    const behaviors = await createMockDriver({
      capabilities: { behaviorDetails: false },
    }).listBehaviors();
    expect(behaviors.every((behavior) => !('fieldsets' in behavior))).toBe(
      true,
    );
  });

  it('previews the schema without a behavior', async () => {
    const driver = createMockDriver();
    const behaviors = (await driver.getType('Event')).behaviors.filter(
      (name) => name !== 'plone.eventcontact',
    );
    const schema = await driver.previewSchema!('Event', behaviors);
    const fields = schema.fieldsets.flatMap((fieldset) => fieldset.fields);
    expect(fields).not.toContain('contact_name');
    expect(fields).toContain('start');
  });

  it('previews a workflow change with counts and suggestions', async () => {
    const driver = createMockDriver();
    const preview = await driver.previewWorkflowChange!({
      types: ['Document', 'Collection'],
      workflow: 'intranet_workflow',
    });
    expect(preview.groups).toHaveLength(1);
    expect(preview.groups[0].types).toEqual(['Document', 'Collection']);
    expect(preview.groups[0].states).toEqual([
      { state: 'private', count: 1, suggested: 'private' },
      { state: 'pending', count: 0, suggested: 'private' },
      { state: 'published', count: 4, suggested: 'external' },
    ]);
  });

  it('runs a workflow change as a job', async () => {
    const driver = createMockDriver({ jobSteps: 2 });
    const job = await driver.changeWorkflow!({
      types: ['Document'],
      workflow: 'intranet_workflow',
      stateMap: {
        simple_publication_workflow: { published: 'internally_published' },
      },
    });
    expect(job.status).toBe('running');
    expect(await driver.getWorkflowChangeJob!(job.id)).toMatchObject({
      status: 'running',
      progress: 0.5,
    });
    expect(await driver.getWorkflowChangeJob!(job.id)).toMatchObject({
      status: 'done',
      progress: 1,
      changed: 3,
    });
    expect((await driver.getType('Document')).workflow).toEqual({
      workflow: 'intranet_workflow',
      followsDefault: false,
    });
    const preview = await driver.previewWorkflowChange!({
      types: ['Document'],
      workflow: 'intranet_workflow',
    });
    expect(
      preview.groups[0].states.find(
        (state) => state.state === 'internally_published',
      )?.count,
    ).toBe(2);
  });

  it('changes the site default for the types that follow it', async () => {
    const driver = createMockDriver({ jobSteps: 1 });
    const job = await driver.changeWorkflow!({
      siteDefault: true,
      workflow: 'one_state_workflow',
    });
    await driver.getWorkflowChangeJob!(job.id);
    const assignments = await driver.getWorkflowAssignments!();
    expect(assignments.default).toBe('one_state_workflow');
    expect(assignments.types.Event).toEqual({
      workflow: 'one_state_workflow',
      followsDefault: true,
    });
    expect(assignments.types.File).toEqual({
      workflow: null,
      followsDefault: false,
    });
  });

  it('exports and imports types', async () => {
    const driver = createMockDriver();
    const file = await driver.exportTypes!(['Event']);
    await driver.updateType('Event', { title: 'Changed' });
    const imported = await driver.importTypes!(file);
    expect(imported.map((type) => type.id)).toEqual(['Event']);
    expect((await driver.getType('Event')).title).toBe('Event');
  });
});
