import { changedSettings, toEditableSettings } from './editableSettings';
import { mockData } from './mock/fixtures';

const event = mockData.types.find((type) => type.id === 'Event')!;

describe('toEditableSettings', () => {
  it('keeps the settings a page edits', () => {
    const editable = toEditableSettings(event);
    expect(editable).toMatchObject({
      title: 'Event',
      allowedContents: { mode: 'selected', types: ['Image', 'File', 'Link'] },
      versioning: 'manual',
    });
    expect(editable).not.toHaveProperty('id');
    expect(editable).not.toHaveProperty('kind');
  });

  it('leaves out settings the driver did not provide', () => {
    const editable = toEditableSettings({
      ...event,
      globalAllow: undefined,
      versioning: undefined,
    });
    expect(editable).not.toHaveProperty('globalAllow');
    expect(editable).not.toHaveProperty('versioning');
  });
});

describe('changedSettings', () => {
  it('returns only what changed', () => {
    const saved = toEditableSettings(event);
    expect(
      changedSettings(saved, {
        ...saved,
        description: 'Happenings',
        allowedContents: { mode: 'all' },
      }),
    ).toEqual({ description: 'Happenings', allowedContents: { mode: 'all' } });
    expect(changedSettings(saved, { ...saved })).toEqual({});
  });
});
