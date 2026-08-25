// Local-only storage.
//
// The privacy claim this product makes is simple and total: your writing lives
// in your browser. There is no account, no database, no sync. The server sees
// exactly one thing — the single thought you explicitly choose to send — and
// keeps none of it.
//
// That is not a limitation worked around; it is the design. Mental health
// writing is the most sensitive category of personal data there is, and the
// safest way to hold it is to not hold it.

import { deleteAllFiles, exportFilesPayload, importFilesPayload } from "./fileStorage";

const KEY = "thought-record:entries:v1";
const PREFS = "thought-record:prefs:v1";

export function loadEntries() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry) {
  if (typeof window === "undefined") return [];
  const entries = loadEntries();
  const next = [{ ...entry, id: `e_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, savedAt: new Date().toISOString() }, ...entries];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — the entry stays in memory for this session */
  }
  return next;
}

export function deleteEntry(id) {
  if (typeof window === "undefined") return [];
  const next = loadEntries().filter((e) => e.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

// Deleting everything is a first-class action, not buried in settings. If the
// promise is "this is yours", taking it back has to be one click.
export function deleteAll() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  deleteAllFiles().catch(() => {});
}

export async function exportEntries() {
  const entries = loadEntries();
  const files = await exportFilesPayload().catch(() => []);
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    entries,
    files,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `thought-records-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(jsonString) {
  if (typeof window === "undefined") return { entriesCount: 0, filesCount: 0 };
  try {
    const data = JSON.parse(jsonString);
    const entriesList = Array.isArray(data) ? data : data.entries || [];
    const filesList = data.files || [];

    if (entriesList.length) {
      const existing = loadEntries();
      const merged = [...entriesList, ...existing.filter((e) => !entriesList.some((x) => x.id === e.id))];
      window.localStorage.setItem(KEY, JSON.stringify(merged));
    }

    let filesCount = 0;
    if (filesList.length) {
      filesCount = await importFilesPayload(filesList);
    }

    return { entriesCount: entriesList.length, filesCount };
  } catch (err) {
    console.error("Failed to import backup:", err);
    throw new Error("Invalid backup JSON format.");
  }
}

export function loadPrefs() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(PREFS) || "{}");
  } catch {
    return {};
  }
}

export function savePrefs(prefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS, JSON.stringify({ ...loadPrefs(), ...prefs }));
}
