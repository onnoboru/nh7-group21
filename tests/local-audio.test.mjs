import test from 'node:test';
import assert from 'node:assert/strict';
import { clearVoiceNotes, deleteVoiceNote, loadVoiceNote, saveVoiceNote } from '../dist/local-audio.js';

function memoryIndexedDB() {
  const records = new Map();
  let storeCreated = false;
  const database = {
    objectStoreNames: { contains: name => name === 'voiceNotes' && storeCreated },
    createObjectStore() { storeCreated = true; },
    transaction() {
      const transaction = {};
      transaction.objectStore = () => ({
        put(record) {
          const request = {};
          queueMicrotask(() => { records.set(record.id, record); request.result = record.id; request.onsuccess?.(); transaction.oncomplete?.(); });
          return request;
        },
        get(id) {
          const request = {};
          queueMicrotask(() => { request.result = records.get(id); request.onsuccess?.(); transaction.oncomplete?.(); });
          return request;
        },
        delete(id) {
          const request = {};
          queueMicrotask(() => { records.delete(id); request.onsuccess?.(); transaction.oncomplete?.(); });
          return request;
        },
        clear() {
          const request = {};
          queueMicrotask(() => { records.clear(); request.onsuccess?.(); transaction.oncomplete?.(); });
          return request;
        },
      });
      return transaction;
    },
  };
  return {
    records,
    open() {
      const request = { result: database };
      queueMicrotask(() => { request.onupgradeneeded?.(); request.onsuccess?.(); });
      return request;
    },
  };
}

test('voice stories stay as audio blobs in a separate local store and can be deleted', async () => {
  const original = globalThis.indexedDB;
  const storage = memoryIndexedDB();
  globalThis.indexedDB = storage;
  try {
    const blob = new Blob(['a tiny family story'], { type: 'audio/webm' });
    await saveVoiceNote('voice-12345678', blob);
    assert.equal((await loadVoiceNote('voice-12345678')).type, 'audio/webm');
    assert.equal(storage.records.size, 1);
    await deleteVoiceNote('voice-12345678');
    assert.equal(await loadVoiceNote('voice-12345678'), null);
    await saveVoiceNote('voice-abcdefgh', blob);
    await saveVoiceNote('voice-abcdefgh2', blob);
    await clearVoiceNotes();
    assert.equal(storage.records.size, 0);
  } finally {
    if (original === undefined) delete globalThis.indexedDB;
    else globalThis.indexedDB = original;
  }
});

test('voice stories reject invalid ids, non-audio data, empty blobs, and large recordings', async () => {
  const original = globalThis.indexedDB;
  globalThis.indexedDB = memoryIndexedDB();
  try {
    await assert.rejects(saveVoiceNote('bad-id', new Blob(['x'], { type: 'audio/webm' })), /valid voice-note name/);
    await assert.rejects(saveVoiceNote('voice-12345678', new Blob(['x'], { type: 'text/plain' })), /audio recording/);
    await assert.rejects(saveVoiceNote('voice-12345678', new Blob([], { type: 'audio/webm' })), /audio recording/);
    await assert.rejects(saveVoiceNote('voice-12345678', { size: 16 * 1024 * 1024, type: 'audio/webm' }), /smaller than 15 MB/);
  } finally {
    if (original === undefined) delete globalThis.indexedDB;
    else globalThis.indexedDB = original;
  }
});
