import { describe, it, expect } from 'vitest';
import { stickyReset, hasNonDefaultAdvanced, blankAddForm } from './person-form';

describe('stickyReset', () => {
  it('clears name and sets the next id, keeping sticky fields', () => {
    const prev = {
      name: 'Alice',
      id: '4',
      sector: 'Work',
      customSector: '',
      circle: '1',
      importance: 'high',
      strength: 'strong',
      direction: 'incoming',
      quality: 'negative',
      color_group: 'colleague',
    };

    const next = stickyReset(prev, 5);

    expect(next.name).toBe('');
    expect(next.id).toBe('5');
    expect(next.sector).toBe('Work');
    expect(next.circle).toBe('1');
    expect(next.importance).toBe('high');
    expect(next.color_group).toBe('colleague');
  });
});

describe('hasNonDefaultAdvanced', () => {
  it('is false when strength/direction/quality are all at defaults', () => {
    expect(
      hasNonDefaultAdvanced({ strength: 'normal', direction: 'mutual', quality: 'positive' })
    ).toBe(false);
  });

  it('is false when advanced fields are absent (treated as defaults)', () => {
    expect(hasNonDefaultAdvanced({ name: 'Bob', sector: 'Work' })).toBe(false);
  });

  it('is true when any advanced field differs from its default', () => {
    expect(hasNonDefaultAdvanced({ strength: 'weak' })).toBe(true);
    expect(hasNonDefaultAdvanced({ direction: 'outgoing' })).toBe(true);
    expect(hasNonDefaultAdvanced({ quality: 'negative' })).toBe(true);
  });
});

describe('blankAddForm', () => {
  it('returns an empty form with the given id and field defaults', () => {
    const form = blankAddForm(7);
    expect(form.name).toBe('');
    expect(form.id).toBe('7');
    expect(form.sector).toBe('');
    expect(form.circle).toBe('2');
    expect(form.importance).toBe('normal');
    expect(form.strength).toBe('normal');
    expect(form.direction).toBe('mutual');
    expect(form.quality).toBe('positive');
    expect(form.color_group).toBe('friend');
  });

  it('has no advanced values flagged as non-default', () => {
    expect(hasNonDefaultAdvanced(blankAddForm(1))).toBe(false);
  });
});
