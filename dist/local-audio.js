const DATABASE_NAME = 'kindred-local-voice-v1';
const STORE_NAME = 'voiceNotes';
const MAX_VOICE_NOTE_BYTES = 15 * 1024 * 1024;

function validId(id) {
  return typeof id === 'string' && /^voice-[A-Za-z0-9_-]{8,128}$/.test(id);
}

function openDatabase(indexedDB = globalThis.indexedDB) {
  if (!indexedDB) return Promise.reject(new Error('Local voice-note storage is not available in this browser.'));
  return new Promise((resolve, reject) => {
    let request;
    try { request = indexedDB.open(DATABASE_NAME, 1); }
    catch { reject(new Error('Local voice-note storage could not be opened.')); return; }
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Local voice-note storage could not be opened.'));
    request.onblocked = () => reject(new Error('Local voice-note storage is busy in another tab.'));
  });
}

function runTransaction(mode, operation) {
  return openDatabase().then(database => new Promise((resolve, reject) => {
    let transaction;
    let result;
    try {
      transaction = database.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(new Error('The voice note could not be saved on this device.'));
      transaction.onabort = () => reject(new Error('The voice note could not be saved on this device.'));
      if (request) {
        request.onsuccess = () => { result = request.result; };
        request.onerror = () => reject(new Error('The voice note could not be saved on this device.'));
      }
    } catch {
      try { transaction?.abort(); } catch { /* The transaction may already be closed. */ }
      reject(new Error('The voice note could not be saved on this device.'));
    }
  }));
}

export function saveVoiceNote(id, blob) {
  if (!validId(id)) return Promise.reject(new Error('Please choose a valid voice-note name.'));
  if (!blob || typeof blob.size !== 'number' || blob.size < 1 || blob.size > MAX_VOICE_NOTE_BYTES || typeof blob.type !== 'string' || !blob.type.startsWith('audio/')) {
    return Promise.reject(new Error('Use an audio recording smaller than 15 MB.'));
  }
  return runTransaction('readwrite', store => store.put({ id, blob, type: blob.type, size: blob.size, savedAt: Date.now() }));
}

export function loadVoiceNote(id) {
  if (!validId(id)) return Promise.reject(new Error('Please choose a valid voice-note name.'));
  return runTransaction('readonly', store => store.get(id)).then(record => record?.blob ?? null);
}

export function deleteVoiceNote(id) {
  if (!validId(id)) return Promise.reject(new Error('Please choose a valid voice-note name.'));
  return runTransaction('readwrite', store => store.delete(id));
}

export function clearVoiceNotes() {
  return runTransaction('readwrite', store => store.clear());
}

export function canRecordVoiceNote() {
  return Boolean(globalThis.indexedDB && globalThis.navigator?.mediaDevices?.getUserMedia && typeof globalThis.MediaRecorder === 'function');
}
