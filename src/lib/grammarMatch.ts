export const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isWordBoundary = (text: string, index: number, length: number) => {
  const before = index > 0 ? text[index - 1] : ' ';
  const after = index + length < text.length ? text[index + 1] : ' ';
  return !/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after);
};

export const findGrammarMatch = (text: string, target: string): { index: number; length: number } | null => {
  const needle = target.trim();
  if (!needle || !text) return null;

  const firstExact = text.indexOf(needle);
  if (firstExact !== -1) {
    let cursor = firstExact;
    while (cursor !== -1) {
      if (isWordBoundary(text, cursor, needle.length)) return { index: cursor, length: needle.length };
      cursor = text.indexOf(needle, cursor + 1);
    }
    return { index: firstExact, length: needle.length };
  }

  const words = needle.split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (!words.length) return null;
  const found = new RegExp(words.join('\\s+'), 'i').exec(text);
  return found ? { index: found.index, length: found[0].length } : null;
};
