import { useEffect } from "react";
import { formatBytes } from "../lib/fileStorage";

export default function FileViewerModal({ file, onClose, onDelete, linkedThought = null }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  function handleDownload() {
    const a = document.createElement("a");
    a.href = file.dataUrl;
    a.download = file.name;
    a.click();
  }

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <div style={styles.titleWrap}>
            <span style={styles.typeBadge}>
              {file.type === "image" ? "📷 Image" : file.type === "audio" ? "🎙️ Voice Note" : "📄 Document"}
            </span>
            <h3 style={styles.fileName}>{file.name}</h3>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </header>

        <div style={styles.body}>
          {file.type === "image" && (
            <div style={styles.mediaWrap}>
              <img src={file.dataUrl} alt={file.name} style={styles.fullImage} />
            </div>
          )}

          {file.type === "audio" && (
            <div style={styles.audioWrap}>
              <div style={styles.audioVisual}>
                <span style={styles.pulseWave} />
                <span style={styles.pulseWaveSmall} />
              </div>
              <audio controls src={file.dataUrl} style={styles.audioPlayer} autoPlay />
            </div>
          )}

          {file.type === "document" && (
            <div style={styles.docWrap}>
              <div style={styles.docIcon}>📄</div>
              <p style={styles.docText}>Document File ({file.mimeType || "Binary"})</p>
              <button style={styles.primaryBtn} onClick={handleDownload}>
                Download & View Document
              </button>
            </div>
          )}

          {linkedThought && (
            <div style={styles.linkedBox}>
              <p style={styles.linkedLabel}>Associated Thought Record</p>
              <p style={styles.linkedThought}>&ldquo;{linkedThought}&rdquo;</p>
            </div>
          )}

          <div style={styles.metaRow}>
            <span>Size: {formatBytes(file.size)}</span>
            <span>Date: {new Date(file.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <footer style={styles.footer}>
          <button style={styles.downloadBtn} onClick={handleDownload}>
            ⬇️ Download File
          </button>

          {onDelete && (
            <button
              style={styles.deleteBtn}
              onClick={() => {
                if (window.confirm(`Delete "${file.name}" permanently from your browser?`)) {
                  onDelete(file.id);
                  onClose();
                }
              }}
            >
              Delete File
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 19, 29, 0.85)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
    animation: "rise .2s ease-out",
  },
  modal: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "90vh",
    background: "var(--surface)",
    border: "1px solid var(--edge)",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid var(--edge-soft)",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    overflow: "hidden",
  },
  typeBadge: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "var(--held)",
    fontWeight: 600,
  },
  fileName: {
    margin: 0,
    fontSize: 16,
    color: "var(--text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  closeBtn: {
    padding: "6px 10px",
    color: "var(--faint)",
    fontSize: 16,
    borderRadius: 6,
  },
  body: {
    padding: 20,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  mediaWrap: {
    display: "flex",
    justifyContent: "center",
    background: "#111622",
    borderRadius: 8,
    padding: 12,
    overflow: "hidden",
  },
  fullImage: {
    maxWidth: "100%",
    maxHeight: 360,
    objectFit: "contain",
    borderRadius: 6,
  },
  audioWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px",
    background: "#141A28",
    borderRadius: 8,
    border: "1px solid var(--edge-soft)",
    gap: 16,
  },
  audioVisual: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 40,
  },
  pulseWave: {
    width: 8,
    height: 32,
    borderRadius: 4,
    background: "var(--warm)",
    animation: "breathe 1.2s infinite ease-in-out",
  },
  pulseWaveSmall: {
    width: 6,
    height: 20,
    borderRadius: 4,
    background: "var(--held)",
    animation: "breathe 1.6s infinite ease-in-out alternate",
  },
  audioPlayer: {
    width: "100%",
    borderRadius: 8,
  },
  docWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 30,
    background: "#141A28",
    borderRadius: 8,
    gap: 12,
  },
  docIcon: {
    fontSize: 48,
  },
  docText: {
    fontSize: 14,
    color: "var(--muted)",
    margin: 0,
  },
  primaryBtn: {
    padding: "10px 18px",
    background: "var(--held)",
    color: "#141828",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
  },
  linkedBox: {
    padding: "14px 16px",
    background: "var(--surface-lift)",
    borderLeft: "2px solid var(--held)",
    borderRadius: 6,
  },
  linkedLabel: {
    fontSize: 11.5,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "var(--faint)",
    margin: "0 0 6px",
  },
  linkedThought: {
    fontFamily: "var(--font-display)",
    fontSize: 15,
    fontStyle: "italic",
    color: "var(--text)",
    margin: 0,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "var(--faint)",
    borderTop: "1px solid var(--edge-soft)",
    paddingTop: 12,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 20px",
    background: "var(--surface)",
    borderTop: "1px solid var(--edge-soft)",
  },
  downloadBtn: {
    padding: "9px 15px",
    background: "var(--surface-lift)",
    border: "1px solid var(--edge)",
    borderRadius: 6,
    fontSize: 13.5,
    color: "var(--text)",
  },
  deleteBtn: {
    padding: "9px 15px",
    color: "#E87A7A",
    fontSize: 13.5,
  },
};
