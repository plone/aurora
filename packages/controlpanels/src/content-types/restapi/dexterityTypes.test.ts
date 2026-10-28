import {
  errorMessage,
  toContentTypeSettings,
  toContentTypeSummary,
  toDexterityTypePatch,
  toBehaviors,
  toFieldTypes,
  toTypeSchemaPut,
} from './dexterityTypes';

describe('toContentTypeSummary', () => {
  it('turns a dexterity types item into a list row', () => {
    expect(
      toContentTypeSummary({
        '@id':
          'http://localhost:55001/plone/@controlpanels/dexterity-types/Event',
        id: 'Event',
        title: 'Event',
        description: 'Events can be shown in calendars.',
        meta_type: 'Dexterity FTI',
        count: 4,
      }),
    ).toEqual({
      id: 'Event',
      title: 'Event',
      description: 'Events can be shown in calendars.',
      kind: 'dexterity',
      count: 4,
    });
  });

  it('marks the site root and types that are not Dexterity types', () => {
    expect(
      toContentTypeSummary({ '@id': '', id: 'Plone Site', title: 'Plone Site' })
        .kind,
    ).toBe('site');
    expect(
      toContentTypeSummary({
        '@id': '',
        id: 'Discussion Item',
        title: 'Comment',
        meta_type: 'Factory-based Type Information',
      }).kind,
    ).toBe('other');
  });

  it('counts missing item counts as zero', () => {
    expect(
      toContentTypeSummary({ '@id': '', id: 'Link', title: 'Link' }).count,
    ).toBe(0);
  });
});

describe('errorMessage', () => {
  it('prefers the message the content API sends', () => {
    expect(
      errorMessage({ data: { message: 'Type already exists' } }, 'Failed'),
    ).toBe('Type already exists');
    expect(errorMessage({}, 'Failed')).toBe('Failed');
  });
});

describe('toContentTypeSettings', () => {
  const response = (data: object, folderish = true) => ({
    '@id':
      'http://localhost:55001/plone/@controlpanels/dexterity-types/Document',
    title: 'Page',
    data: { title: 'Page', description: '', ...data },
    schema: {
      properties: folderish
        ? { title: {}, filter_content_types: {}, allowed_content_types: {} }
        : { title: {} },
      fieldsets: [
        { id: 'default', fields: ['title'] },
        { id: 'behaviors', fields: ['plone.dublincore', 'plone.locking'] },
      ],
    },
  });

  it('reads what can be added inside a folderish type', () => {
    expect(
      toContentTypeSettings(
        'Document',
        response({ filter_content_types: false }),
      ).allowedContents,
    ).toEqual({ mode: 'all' });
    expect(
      toContentTypeSettings(
        'Document',
        response({ filter_content_types: true, allowed_content_types: [] }),
      ).allowedContents,
    ).toEqual({ mode: 'none' });
    expect(
      toContentTypeSettings(
        'Document',
        response({
          filter_content_types: true,
          allowed_content_types: ['Image', 'File'],
        }),
      ).allowedContents,
    ).toEqual({ mode: 'selected', types: ['Image', 'File'] });
  });

  it('has no contents settings for a type that is not folderish', () => {
    const settings = toContentTypeSettings('Link', response({}, false));
    expect(settings.folderish).toBe(false);
    expect(settings).not.toHaveProperty('allowedContents');
  });

  it('lists the enabled behaviors', () => {
    expect(
      toContentTypeSettings(
        'Document',
        response({ 'plone.dublincore': true, 'plone.locking': false }),
      ).behaviors,
    ).toEqual(['plone.dublincore']);
  });
});

describe('toDexterityTypePatch', () => {
  it('patches only what changed', () => {
    expect(toDexterityTypePatch({ description: 'Pages' })).toEqual({
      description: 'Pages',
    });
  });

  it("writes the overview form's contents choice", () => {
    expect(
      toDexterityTypePatch({
        allowedContents: { mode: 'selected', types: ['Image'] },
      }),
    ).toEqual({
      filter_content_types: 'some',
      allowed_content_types: ['Image'],
    });
    expect(toDexterityTypePatch({ allowedContents: { mode: 'none' } })).toEqual(
      { filter_content_types: 'none', allowed_content_types: [] },
    );
    expect(toDexterityTypePatch({ allowedContents: { mode: 'all' } })).toEqual({
      filter_content_types: 'all',
    });
  });
});

describe('toTypeSchemaPut', () => {
  it('lets plone.restapi add and change the custom fields', () => {
    const put = toTypeSchemaPut({
      title: 'Event',
      type: 'object',
      fieldsets: [
        { id: 'default', title: 'Default', fields: ['title', 'pages', 'new'] },
      ],
      properties: {
        title: { title: 'Title', behavior: 'plone.dublincore' },
        pages: {
          title: 'Pages',
          behavior: 'plone.dexterity.schema.generated.plone_5_1_0_Event',
        },
        new: { title: 'New', behavior: 'plone.dexterity.schema.generated' },
      },
      required: ['title', 'new'],
    });
    expect(put.properties.title).toEqual({
      title: 'Title',
      behavior: 'plone.dublincore',
    });
    expect(put.properties.pages).toMatchObject({
      behavior: '',
      required: false,
    });
    expect(put.properties.new).toMatchObject({ behavior: '', required: true });
  });
});

describe('toFieldTypes', () => {
  it('keys the field types by token, once per title', () => {
    expect(
      toFieldTypes([
        { token: 'label_integer_field', title: 'Integer' },
        { token: 'Email', title: 'Email' },
        { token: 'label_email', title: 'Email' },
      ]),
    ).toEqual([
      { id: 'label_integer_field', title: 'Integer' },
      { id: 'Email', title: 'Email' },
    ]);
  });
});

describe('behaviors', () => {
  const overview = {
    '@id': 'http://localhost:55001/plone/@controlpanels/dexterity-types/Event',
    title: 'Event',
    data: { 'plone.locking': true, 'plone.leadimage': false },
    schema: {
      properties: {
        'plone.locking': { title: 'Locking', description: 'Locking support' },
        'plone.leadimage': { title: 'Lead Image' },
      },
      fieldsets: [
        { id: 'default', fields: [] },
        { id: 'behaviors', fields: ['plone.locking', 'plone.leadimage'] },
      ],
    },
  };

  it('lists the behaviors of the overview form', () => {
    expect(toBehaviors(overview)).toEqual([
      {
        name: 'plone.locking',
        title: 'Locking',
        description: 'Locking support',
      },
      { name: 'plone.leadimage', title: 'Lead Image', description: undefined },
    ]);
    expect(toContentTypeSettings('Event', overview).behaviors).toEqual([
      'plone.locking',
    ]);
  });

  it('saves behaviors as the on/off map, turning the others off', () => {
    expect(
      toDexterityTypePatch({ behaviors: ['plone.leadimage'] }, [
        'plone.locking',
        'plone.leadimage',
      ]),
    ).toEqual({ 'plone.locking': false, 'plone.leadimage': true });
  });
});
