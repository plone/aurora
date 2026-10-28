import { describe, expect, it } from 'vitest';
import {
  addsFields,
  behaviorFields,
  enabledAlternative,
  estimateFormPreview,
  fieldBehavior,
  includedBy,
  includes,
  moveBehaviors,
  replaceBehavior,
  shiftBehavior,
  type BehaviorContext,
} from './behaviorEditing';
import { DEFAULT_BEHAVIOR_METADATA as metadata } from './behaviorMetadata';
import { mockData } from './mock/fixtures';

const event = mockData.types.find((type) => type.id === 'Event')!;
const schema = mockData.schemas.Event;
const withDetails: BehaviorContext = {
  behaviors: mockData.behaviors,
  schema,
  saved: event.behaviors,
  metadata,
};
// What plone.restapi says today: names and titles only.
const basic: BehaviorContext = {
  ...withDetails,
  behaviors: mockData.behaviors.map(({ fieldsets, ...behavior }) => behavior),
};

describe('behaviorEditing', () => {
  it('maps interface names of schema fields to behavior names', () => {
    expect(
      fieldBehavior('plone.app.discussion.behavior.IAllowDiscussion', metadata),
    ).toBe('plone.allowdiscussion');
    expect(fieldBehavior('plone.eventbasic', metadata)).toBe(
      'plone.eventbasic',
    );
  });

  it('tells what a behavior adds, from the driver or the schema', () => {
    expect(behaviorFields('plone.eventlocation', withDetails)).toEqual([
      'location',
    ]);
    expect(behaviorFields('plone.allowdiscussion', basic)).toEqual([
      'allow_discussion',
    ]);
    // Not on the type, and the driver doesn't say.
    expect(behaviorFields('plone.leadimage', basic)).toBeUndefined();
    expect(behaviorFields('plone.locking', basic)).toEqual([]);
  });

  it('tells features from behaviors that add fields', () => {
    expect(addsFields('plone.eventbasic', basic)).toBe(true);
    expect(addsFields('plone.locking', basic)).toBe(false);
    // Saved, but nothing in the schema comes from it.
    expect(addsFields('plone.textindexer', basic)).toBe(false);
    // Unknown counts as adding fields.
    expect(addsFields('collective.sponsors', basic)).toBe(true);
  });

  it('knows which behaviors overlap', () => {
    expect(includedBy('plone.basic', ['plone.dublincore'], metadata)).toBe(
      'plone.dublincore',
    );
    expect(
      includes('plone.dublincore', ['plone.basic', 'plone.locking'], metadata),
    ).toEqual(['plone.basic']);
    expect(
      enabledAlternative('volto.preview_image', event.behaviors, metadata),
    ).toBe('volto.preview_image_link');
  });

  it('changes the order of behaviors', () => {
    const list = ['a', 'b', 'c', 'd'];
    expect(moveBehaviors(list, ['d'], 'b', 'before')).toEqual([
      'a',
      'd',
      'b',
      'c',
    ]);
    expect(replaceBehavior(list, 'b', 'x')).toEqual(['a', 'x', 'c', 'd']);
    expect(shiftBehavior(list, 'c', -1)).toEqual(['a', 'c', 'b', 'd']);
    // Skips behaviors outside the list it moves in.
    expect(shiftBehavior(list, 'c', -1, (name) => name !== 'b')).toEqual([
      'c',
      'a',
      'b',
      'd',
    ]);
    expect(shiftBehavior(list, 'a', -1)).toBe(list);
  });

  it('estimates the form with other behaviors', () => {
    const removed = estimateFormPreview(
      event.behaviors.filter((name) => name !== 'plone.eventlocation'),
      basic,
    );
    const fields = removed.schema.fieldsets.flatMap((entry) => entry.fields);
    expect(fields).not.toContain('location');
    expect(fields).toContain('registration_required');
    // The type's own empty fieldset stays.
    expect(removed.schema.fieldsets.map((fieldset) => fieldset.id)).toContain(
      'registration',
    );

    const added = [...event.behaviors, 'plone.leadimage'];
    expect(estimateFormPreview(added, basic).pending).toEqual([
      'plone.leadimage',
    ]);
    const detailed = estimateFormPreview(added, withDetails);
    expect(detailed.pending).toEqual([]);
    expect(
      detailed.schema.fieldsets.flatMap((entry) => entry.fields),
    ).toContain('image');
  });
});
