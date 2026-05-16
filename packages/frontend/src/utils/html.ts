const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

export function decodeHtmlEntities(value: string) {
  return value.replace(
    /&(#\d+|#x[\da-fA-F]+|[a-zA-Z]+);/g,
    (match: string, entity: string) => {
      if (entity[0] === '#') {
        const codePoint =
          entity[1]?.toLowerCase() === 'x'
            ? Number.parseInt(entity.slice(2), 16)
            : Number.parseInt(entity.slice(1), 10);

        return Number.isNaN(codePoint) || codePoint > 0x10ffff
          ? match
          : String.fromCodePoint(codePoint);
      }

      return HTML_ENTITIES[entity] ?? match;
    }
  );
}
