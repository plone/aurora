import { describe, expect, it } from 'vitest';
import { record, recorded, REPLAY_MAX } from './buffer';
import type { BufferedEvent } from '../events';

const event = (id: string): BufferedEvent => ({
  type: 'timing',
  payload: {
    id,
    kind: 'request',
    side: 'server',
    start: 0,
    end: 1,
    status: 'success',
  },
});

describe('replay buffer', () => {
  it('keeps the most recent events only', () => {
    for (let i = 0; i < REPLAY_MAX + 10; i++) record(event(String(i)));
    const events = recorded();
    expect(events).toHaveLength(REPLAY_MAX);
    expect(events[0].payload.id).toBe('10');
    expect(events.at(-1)?.payload.id).toBe(String(REPLAY_MAX + 9));
  });

  it('returns a copy', () => {
    const events = recorded();
    events.length = 0;
    expect(recorded().length).toBeGreaterThan(0);
  });
});
