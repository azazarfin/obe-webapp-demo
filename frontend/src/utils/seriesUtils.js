export const normalizeSeriesYears = (values = []) => Array.from(new Set(
  values
    .map((value) => String(value || '').trim())
    .filter((value) => /^[0-9]{4}$/.test(value))
)).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
