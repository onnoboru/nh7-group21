import test from 'node:test';
import assert from 'node:assert/strict';
import { savePhoto, loadPhoto, deletePhoto, clearPhotos } from '../dist/local-photos.js';

function memoryIndexedDB() {
  const records = new Map();
  let storeCreated = false;
  const database = {
    close() {},
    objectStoreNames: { contains: name => name === 'photos' && storeCreated },
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


test('selfies stay in a separate local blob store and support deletion and reset', async () => {
  const original = globalThis.indexedDB;
  const storage = memoryIndexedDB();
  globalThis.indexedDB = storage;
  try {
    const blob = new Blob(['photo pixels'], { type: 'image/jpeg' });
    await savePhoto('photo-12345678', blob);
    assert.equal(await (await loadPhoto('photo-12345678')).text(), 'photo pixels');
    assert.equal(storage.records.size, 1);
    await deletePhoto('photo-12345678');
    assert.equal(await loadPhoto('photo-12345678'), null);
    await savePhoto('photo-abcdefgh', blob);
    await savePhoto('photo-ijklmnop', blob);
    await clearPhotos();
    assert.equal(storage.records.size, 0);
    for (const id of ['', 'photo-short', '../photo-12345678', 'https://example.com']) {
      await assert.rejects(savePhoto(id, blob), /valid photo name/);
      await assert.rejects(loadPhoto(id), /valid photo name/);
      await assert.rejects(deletePhoto(id), /valid photo name/);
    }
    for (const invalid of [new Blob([], { type: 'image/jpeg' }), new Blob(['x'], { type: 'image/svg+xml' }), new Blob(['x'], { type: 'audio/webm' }), new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' }), { size: 1, type: 'image/jpeg' }]) {
      await assert.rejects(savePhoto('photo-12345678', invalid), /photo smaller/);
    }
    delete globalThis.indexedDB;
    await assert.rejects(savePhoto('photo-12345678', blob), /unavailable/);
    globalThis.indexedDB = { open() { throw new Error('denied'); } };
    await assert.rejects(loadPhoto('photo-12345678'), /could not be opened/);
    assert.equal(storage.records.size, 0);
  } finally {
    if (original === undefined) delete globalThis.indexedDB;
    else globalThis.indexedDB = original;
  }
});
