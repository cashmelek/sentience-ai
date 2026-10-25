import { describe, it, expect } from 'vitest';
import { escapeRegExp, findGrammarMatch } from '../lib/grammarMatch';

describe('escapeRegExp', () => {
  it('escapes special regex characters', () => {
    expect(escapeRegExp('hello.world')).toBe('hello\\.world');
    expect(escapeRegExp('a*b+c?d^e$f{g}h(i)j|k[l]m\\n')).toBe('a\\*b\\+c\\?d\\^e\\$f\\{g\\}h\\(i\\)j\\|k\\[l\\]m\\\\n');
  });

  it('leaves normal characters alone', () => {
    expect(escapeRegExp('hello world 123')).toBe('hello world 123');
  });
});

describe('findGrammarMatch', () => {
  it('returns null for empty text or target', () => {
    expect(findGrammarMatch('', 'target')).toBeNull();
    expect(findGrammarMatch('text', '')).toBeNull();
    expect(findGrammarMatch('text', '   ')).toBeNull(); // whitespace only target
  });

  it('finds exact match with word boundaries', () => {
    const result = findGrammarMatch('hello world today', 'world');
    expect(result).toEqual({ index: 6, length: 5 });
  });

  it('finds exact match without word boundaries (fallback to first match)', () => {
    const result = findGrammarMatch('helloworldtoday', 'world');
    expect(result).toEqual({ index: 5, length: 5 });
  });

  it('prefers word boundary matches when multiple exact matches exist', () => {
    const result = findGrammarMatch('helloworld world', 'world');
    expect(result).toEqual({ index: 11, length: 5 });
  });

  it('falls back to regex for case-insensitive matches', () => {
    const result = findGrammarMatch('Hello WORLD today', 'world');
    expect(result).toEqual({ index: 6, length: 5 });
  });

  it('falls back to regex with varying whitespace', () => {
    const result = findGrammarMatch('hello   world today', 'hello world');
    expect(result).toEqual({ index: 0, length: 13 });
  });

  it('handles regex special characters in the target string during regex fallback', () => {
    const result = findGrammarMatch('HELLO [WORLD] TODAY', 'hello [world]');
    expect(result).toEqual({ index: 0, length: 13 });
  });

  it('returns null when no match is found', () => {
    expect(findGrammarMatch('hello world', 'goodbye')).toBeNull();
  });
});
