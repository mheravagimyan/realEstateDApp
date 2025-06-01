/* простейшее хранилище метаданных в localStorage */

const KEY = "estate_meta";

function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}

export function saveMeta(hash, data) {
  const all = loadAll();
  all[hash] = data;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getMeta(hash) {
  return loadAll()[hash];
}
