// Privacy-first local IndexedDB storage for files & audio recordings.
// Binary data stays strictly inside the user's browser IndexedDB database.

const DB_NAME = "thought-record-files";
const DB_VERSION = 1;
const STORE_NAME = "files";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("entryId", "entryId", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Convert Blob/File to Data URL for easy rendering and portability
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

// Determine file category (image, audio, document)
export function getFileType(mimeType, name = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp3", "wav", "ogg", "m4a", "webm", "aac"].includes(ext)) return "audio";
  return "document";
}

// Format bytes into readable string (e.g. 1.2 MB)
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function saveFile({ file, entryId = null, customName = null, duration = null }) {
  const db = await openDB();
  if (!db) return null;

  const id = `f_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const dataUrl = await blobToDataURL(file);
  const name = customName || file.name || `Recording ${new Date().toLocaleTimeString()}`;
  const mimeType = file.type || "application/octet-stream";
  const type = getFileType(mimeType, name);
  const size = file.size || dataUrl.length;

  const record = {
    id,
    entryId,
    name,
    mimeType,
    type,
    size,
    dataUrl,
    duration, // For audio recordings in seconds
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(record);

    req.onsuccess = () => resolve(record);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function linkFilesToEntry(fileIds, entryId) {
  if (!fileIds || !fileIds.length) return;
  const db = await openDB();
  if (!db) return;

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  for (const id of fileIds) {
    const req = store.get(id);
    req.onsuccess = () => {
      const record = req.result;
      if (record) {
        record.entryId = entryId;
        store.put(record);
      }
    };
  }
}

export async function getFilesForEntry(entryId) {
  if (!entryId) return [];
  const db = await openDB();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("entryId");
    const req = index.getAll(entryId);

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllFiles() {
  const db = await openDB();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const files = req.result || [];
      // Sort newest first
      files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(files);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteFile(id) {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteAllFiles() {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getStorageStats() {
  const files = await getAllFiles();
  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
  return {
    count: files.length,
    bytes: totalBytes,
    formatted: formatBytes(totalBytes),
    byType: {
      image: files.filter((f) => f.type === "image").length,
      audio: files.filter((f) => f.type === "audio").length,
      document: files.filter((f) => f.type === "document").length,
    },
  };
}

export async function exportFilesPayload() {
  const files = await getAllFiles();
  return files.map(({ id, entryId, name, mimeType, type, size, dataUrl, duration, createdAt }) => ({
    id,
    entryId,
    name,
    mimeType,
    type,
    size,
    dataUrl,
    duration,
    createdAt,
  }));
}

export async function importFilesPayload(filesList) {
  if (!Array.isArray(filesList) || !filesList.length) return 0;
  const db = await openDB();
  if (!db) return 0;

  let count = 0;
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  for (const item of filesList) {
    if (item.id && item.dataUrl) {
      store.put(item);
      count++;
    }
  }

  return count;
}
