import { SCRIBAN_FUNCTIONS, getFiltersForType } from '../components/scriban-filters';

describe('scriban-filters', () => {
  describe('getFiltersForType', () => {
    it('should return date filters for DateTime', () => {
      const filters = getFiltersForType('DateTime');
      expect(filters.map((f) => f.label)).toContain('dd/MM/yyyy');
      expect(filters[0]?.expression('createdAt')).toBe(
        '{{ createdAt | date.to_string "%d/%m/%Y" }}'
      );
    });

    it.each(['Decimal', 'Double', 'Single', 'Int32', 'Int64', 'Int16'])(
      'should return number filters for %s',
      (type) => {
        const filters = getFiltersForType(type);
        expect(filters.map((f) => f.label)).toContain('round');
        expect(filters.map((f) => f.label)).toContain('format N2');
      }
    );

    it('should return boolean filters for Boolean', () => {
      const filters = getFiltersForType('Boolean');
      expect(filters).toHaveLength(1);
      expect(filters[0]?.expression('active')).toBe('{{ if active }}yes{{ else }}no{{ end }}');
    });

    it('should return string filters for String', () => {
      const filters = getFiltersForType('String');
      expect(filters.map((f) => f.label)).toContain('upcase');
      expect(filters[0]?.expression('name')).toBe('{{ name | string.upcase }}');
    });

    it('should fall back to string filters for an unknown type', () => {
      expect(getFiltersForType('Guid')).toBe(getFiltersForType('String'));
    });

    it('should build correct number filter expressions', () => {
      const filters = getFiltersForType('Decimal');
      const round = filters.find((f) => f.label === 'round');
      expect(round?.expression('total')).toBe('{{ total | math.round 2 }}');
    });

    it('should build correct string filter expressions for replace', () => {
      const filters = getFiltersForType('String');
      const replace = filters.find((f) => f.label === 'replace');
      expect(replace?.expression('text')).toBe('{{ text | string.replace "old" "new" }}');
    });
  });

  describe('all filter expressions', () => {
    it.each(['String', 'DateTime', 'Decimal', 'Boolean'])(
      'should produce a non-empty expression for every %s filter',
      (type) => {
        for (const filter of getFiltersForType(type)) {
          const expr = filter.expression('field');
          expect(expr).toContain('field');
          expect(expr.startsWith('{{')).toBe(true);
        }
      }
    );
  });

  describe('SCRIBAN_FUNCTIONS', () => {
    it('should expose the control-flow snippets', () => {
      expect(SCRIBAN_FUNCTIONS.map((f) => f.name)).toEqual([
        'if / else',
        'for',
        'capture',
        'include',
      ]);
    });

    it('should provide a non-empty expression for each function', () => {
      for (const fn of SCRIBAN_FUNCTIONS) {
        expect(fn.expression.length).toBeGreaterThan(0);
        expect(fn.description.length).toBeGreaterThan(0);
      }
    });
  });
});
