/** Ключ, под которым все лоты лежат в localStorage */
const LS_KEY = "landListings";

/** Прочитать объект вида { hash: { location, area, priceEth }, … } */
export function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Сохранить объект обратно в localStorage */
export function saveStore(storeObj) {
  localStorage.setItem(LS_KEY, JSON.stringify(storeObj));
}

/** Добавить или обновить запись по хэшу */
export function upsertListing(hash, meta) {
  const store = loadStore();
  store[hash.toLowerCase()] = meta;
  saveStore(store);
}

/** Получить метаданные лота по хэшу (или null) */
export function getListingMeta(hash) {
  const store = loadStore();
  return store[hash.toLowerCase()] || null;
}
