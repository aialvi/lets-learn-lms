import { addMonths, csvCell, DAY, grade, publicSnapshot, reminderBucket } from './training-policy';
describe('training policies', () => {
  it('clamps month-end expiry and preserves UTC time', () => { expect(addMonths(new Date('2028-01-31T15:10:00Z'), 1).toISOString()).toBe('2028-02-29T15:10:00.000Z'); });
  it('grades without rounding a failing score into a pass', () => {
    const quiz = { passPercent: 67, questions: [0, 0, 0].map(correctIndex => ({ type: 'boolean', prompt: '?', options: ['True', 'False'], correctIndex })) };
    expect(grade(quiz, [0, 0, 1]).passed).toBe(false);
    expect(() => grade(quiz, [0])).toThrow(); expect(() => grade(quiz, [0, 0, 9])).toThrow();
  });
  it('never exposes correct answers to a learner', () => { const snapshot = { title: 'Test', lessons: [], quiz: { passPercent: 80, questions: [{ type: 'choice', prompt: '?', options: ['A', 'B'], correctIndex: 1 }] }, validityMonths: null, certificationEnabled: false, renewalMode: 'full' }; expect(publicSnapshot(snapshot).quiz!.questions[0]).not.toHaveProperty('correctIndex'); });
  it('uses only the current reminder window and weekly overdue buckets', () => {
    const now = new Date('2026-10-08T12:00:00Z'); const at = (days: number) => new Date(now.getTime() + days * DAY);
    expect(reminderBucket(at(29), now, true)).toBe('due-30'); expect(reminderBucket(at(29), now, false)).toBeNull(); expect(reminderBucket(at(6), now, false)).toBe('due-7'); expect(reminderBucket(at(0.5), now, false)).toBe('due-1'); expect(reminderBucket(at(-9), now, true)).toBe('overdue-1');
  });
  it('escapes CSV formulas, quotes, and multiline values', () => { expect(csvCell('=1+1')).toBe('"\'=1+1"'); expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"'); });
});
