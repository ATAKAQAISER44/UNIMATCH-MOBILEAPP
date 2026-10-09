// src/utils/listKeys.js
//
// React needs a unique `key` for every item in a list. Backend rows are not
// always unique: the attributes dataset gives every row the same
// university_id, and ranking files can repeat a name. These helpers build a
// readable key from the row and add "#2", "#3"... when it repeats, so keys
// are always unique (and stay stable while the list does not change).

// Readable key of one university-like row.
export function rowKey(row, fallback = '') {
  if (row === null || row === undefined) return String(fallback);
  if (typeof row !== 'object') return String(row);
  const name = row.name || row.university_name || row.Institution_Name || row.institution || '';
  const country = row.country || row.Country || row.Location || '';
  const rank = row.official_rank ?? row.rank ?? row.experimental_rank ?? '';
  const id = row.university_id || row.id || row.key || '';
  return [id, name, country, rank].filter((part) => part !== '' && part !== null && part !== undefined).join('|') || String(fallback);
}

// Unique keys for a whole list: uniqueKeys(rows) or uniqueKeys(rows, (row) => row.name).
export function uniqueKeys(items = [], getKey = rowKey) {
  const seen = new Map();
  return items.map((item, index) => {
    const base = String(getKey(item, index) || index);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}#${count}`;
  });
}
