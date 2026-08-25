import { useState, useEffect } from "react";
import {
  getAllFiles,
  getStorageStats,
  deleteFile,
  deleteAllFiles,
  formatBytes,
} from "../lib/fileStorage";
import FileUploader from "./FileUploader";
import FileViewerModal from "./FileViewerModal";

export default function FileManager({ entries = [], onFilesUpdated }) {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const all = await getAllFiles();
    const st = await getStorageStats();
    setFiles(all);
    setStats(st);
    setLoading(false);
    if (onFilesUpdated) onFilesUpdated(all.length);
  }

  async function handleDeleteFile(id) {
    await deleteFile(id);
    await loadData();
  }

  async function handleDeleteAll() {
    if (!window.confirm("Delete all stored media files and voice notes from your browser? This cannot be undone.")) {
      return;
    }
    await deleteAllFiles();
    await loadData();
  }

  function getLinkedThought(entryId) {
    if (!entryId) return null;
    const entry = entries.find((e) => e.id === entryId);
    return entry ? entry.thought : null;
  }

  const filteredFiles = files.filter((f) => {
    if (category !== "all" && f.type !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const linked = getLinkedThought(f.entryId)?.toLowerCase() || "";
      return f.name.toLowerCase().includes(q) || linked.includes(q);
    }
    return true;
  });

  return (
    <div style={styles.rise}>
      <h1 style={styles.h1}>Your stored files</h1>
      <p style={styles.lede}>
        Voice recordings, journal photos, and evidence documents stay saved locally on this device.
      </p>

      {stats && (
        <div style={styles.statsBar}>
          <div style={styles.statBox}>
            <span style={styles.statVal}>{stats.count}</span>
            <span style={styles.statLabel}>total files</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statVal}>{stats.formatted}</span>
            <span style={styles.statLabel}>local storage used</span>
          </div>
          <div style={styles.statBreakdown}>
            <span style={styles.badge}>📷 {stats.byType.image} images</span>
            <span style={styles.badge}>🎙️ {stats.byType.audio} voice notes</span>
            <span style={styles.badge}>📄 {stats.byType.document} docs</span>
          </div>
        </div>
      )}

      <div style={styles.uploadCard}>
        <p style={styles.stepMark}>Add new file or voice note</p>
        <FileUploader onFilesChange={loadData} />
      </div>

      <div style={styles.controlsRow}>
        <div style={styles.categories}>
          {["all", "image", "audio", "document"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                ...styles.catTab,
                ...(category === cat ? styles.catTabActive : {}),
              }}
            >
              {cat === "all" ? "All Files" : cat === "image" ? "Images" : cat === "audio" ? "Voice Notes" : "Documents"}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {loading ? (
        <p style={styles.emptyText}>Loading files...</p>
      ) : filteredFiles.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={styles.emptyTitle}>
            {files.length === 0 ? "No files stored yet" : "No matching files found"}
          </p>
          <p style={styles.emptySub}>
            Attach photos or record voice notes when writing a thought record, or upload files directly above.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredFiles.map((file) => {
            const linkedText = getLinkedThought(file.entryId);
            return (
              <div
                key={file.id}
                style={styles.card}
                onClick={() => setSelectedFile(file)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => e.key === "Enter" && setSelectedFile(file)}
              >
                <div style={styles.cardMedia}>
                  {file.type === "image" ? (
                    <img src={file.dataUrl} alt={file.name} style={styles.cardImg} />
                  ) : file.type === "audio" ? (
                    <div style={styles.cardAudioBox}>
                      <span style={styles.audioIcon}>🎙️</span>
                      {file.duration && (
                        <span style={styles.durationTag}>
                          {Math.floor(file.duration / 60)}:{String(file.duration % 60).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={styles.cardDocBox}>
                      <span style={styles.docIcon}>📄</span>
                    </div>
                  )}
                </div>

                <div style={styles.cardBody}>
                  <p style={styles.cardTitle}>{file.name}</p>
                  {linkedText && (
                    <p style={styles.cardLinked}>&ldquo;{linkedText}&rdquo;</p>
                  )}
                  <div style={styles.cardMeta}>
                    <span>{formatBytes(file.size)}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div style={styles.purgeRow}>
          <button style={styles.purgeBtn} onClick={handleDeleteAll}>
            Clear all stored files
          </button>
        </div>
      )}

      {selectedFile && (
        <FileViewerModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDelete={handleDeleteFile}
          linkedThought={getLinkedThought(selectedFile.entryId)}
        />
      )}
    </div>
  );
}

const styles = {
  rise: { animation: "rise .4s ease-out" },
  h1: {
    fontFamily: "var(--font-display)",
    fontSize: 36,
    fontWeight: 400,
    lineHeight: 1.18,
    letterSpacing: -0.4,
    margin: "0 0 16px",
  },
  lede: { fontSize: 15.5, lineHeight: 1.7, color: "var(--muted)", margin: "0 0 32px" },
  statsBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    padding: "16px 20px",
    background: "var(--surface)",
    border: "1px solid var(--edge)",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 28,
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    marginRight: 16,
  },
  statVal: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    color: "var(--held)",
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 12,
    color: "var(--faint)",
    marginTop: 3,
  },
  statBreakdown: {
    display: "flex",
    gap: 8,
    marginLeft: "auto",
    flexWrap: "wrap",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 999,
    background: "var(--surface-lift)",
    fontSize: 12,
    color: "var(--muted)",
  },
  uploadCard: {
    marginBottom: 32,
  },
  stepMark: {
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "var(--faint)",
    margin: "0 0 10px",
    fontWeight: 500,
  },
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  categories: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  catTab: {
    padding: "7px 14px",
    borderRadius: 999,
    fontSize: 13,
    background: "var(--surface)",
    border: "1px solid var(--edge)",
    color: "var(--muted)",
    transition: "all .18s",
  },
  catTabActive: {
    background: "var(--held-dim)",
    borderColor: "var(--held)",
    color: "var(--text)",
  },
  searchInput: {
    padding: "8px 14px",
    background: "var(--surface)",
    border: "1px solid var(--edge)",
    borderRadius: 8,
    color: "var(--text)",
    fontSize: 13.5,
    minWidth: 200,
  },
  emptyText: {
    color: "var(--muted)",
    textAlign: "center",
    padding: "40px 0",
  },
  emptyBox: {
    padding: 40,
    textAlign: "center",
    background: "var(--surface)",
    border: "1px solid var(--edge)",
    borderRadius: 10,
  },
  emptyTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 18,
    margin: "0 0 8px",
    color: "var(--text)",
  },
  emptySub: {
    fontSize: 14,
    color: "var(--faint)",
    maxWidth: 400,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: 14,
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--edge)",
    borderRadius: 8,
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform .15s, border-color .15s",
    display: "flex",
    flexDirection: "column",
  },
  cardMedia: {
    height: 120,
    background: "#121724",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cardImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardAudioBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  audioIcon: {
    fontSize: 32,
  },
  durationTag: {
    fontSize: 11,
    padding: "2px 6px",
    background: "rgba(0,0,0,0.6)",
    borderRadius: 4,
    color: "var(--warm)",
    fontFamily: "monospace",
  },
  cardDocBox: {
    fontSize: 36,
  },
  cardBody: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    flex: 1,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 13.5,
    margin: "0 0 4px",
    color: "var(--text)",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardLinked: {
    fontSize: 12,
    fontStyle: "italic",
    color: "var(--muted)",
    margin: "0 0 8px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: "var(--faint)",
    marginTop: "auto",
  },
  purgeRow: {
    marginTop: 36,
    textAlign: "center",
  },
  purgeBtn: {
    fontSize: 13,
    color: "var(--faint)",
    padding: "8px 16px",
    border: "1px solid var(--edge-soft)",
    borderRadius: 6,
  },
};
