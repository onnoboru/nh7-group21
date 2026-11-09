const DATABASE_NAME = 'kindred-local-photos-v1';
const STORE_NAME = 'photos';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function validId(id) {
  return typeof id === 'string' && /^photo-[A-Za-z0-9_-]{8,128}$/.test(id);
}

function transaction(mode, operation) {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Photo storage is unavailable. Your review is already saved.')); return; }
    let request;
    try { request = indexedDB.open(DATABASE_NAME, 1); }
    catch { reject(new Error('Photo storage could not be opened.')); return; }
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onerror = () => reject(new Error('Photo storage could not be opened.'));
    request.onblocked = () => reject(new Error('Photo storage is busy in another tab.'));
    request.onsuccess = () => {
      const database = request.result;
      let tx;
      try {
        tx = database.transaction(STORE_NAME, mode);
        const result = operation(tx.objectStore(STORE_NAME));
        tx.oncomplete = () => { database.close(); resolve(result?.result ?? null); };
        tx.onerror = tx.onabort = () => { database.close(); reject(new Error('The photo could not be saved on this device.')); };
      } catch {
        try { tx?.abort(); } catch { /* Already closed. */ }
        database.close();
        reject(new Error('Photo storage is unavailable. Please try again.'));
      }
    };
  });
}

export function savePhoto(id, blob) {
  if (!validId(id)) return Promise.reject(new Error('Please choose a valid photo name.'));
  if (!(blob instanceof Blob) || !['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) || blob.size < 1 || blob.size > MAX_PHOTO_BYTES) {
    return Promise.reject(new Error('Use a photo smaller than 5 MB.'));
  }
  return transaction('readwrite', store => store.put({ id, blob })).then(() => undefined);
}

export function loadPhoto(id) {
  if (!validId(id)) return Promise.reject(new Error('Please choose a valid photo name.'));
  return transaction('readonly', store => store.get(id)).then(record => record?.blob ?? null);
}

export function deletePhoto(id) {
  if (!validId(id)) return Promise.reject(new Error('Please choose a valid photo name.'));
  return transaction('readwrite', store => store.delete(id));
}

export function clearPhotos() {
  return transaction('readwrite', store => store.clear());
}
