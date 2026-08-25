import { useState, useRef, useEffect } from "react";
import { saveFile, deleteFile, formatBytes } from "../lib/fileStorage";

export default function FileUploader({ attachedFiles = [], onFilesChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleFileAdd(files) {
    if (!files || !files.length) return;
    setUploading(true);
    setError("");

    try {
      const savedList = [];
      for (const file of Array.from(files)) {
        // Limit max file size to 25MB per file for performance
        if (file.size > 25 * 1024 * 1024) {
          setError(`"${file.name}" exceeds maximum size of 25MB.`);
          continue;
        }
        const record = await saveFile({ file });
        if (record) savedList.push(record);
      }
      if (savedList.length > 0) {
        onFilesChange([...attachedFiles, ...savedList]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save attachment locally.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFileAdd(e.dataTransfer.files);
    }
  }

  // Voice Recording functions
  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported("audio/webm")
        ? { mimeType: "audio/webm" }
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? { mimeType: "audio/mp4" }
        : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        const duration = recordSeconds;
        const now = new Date();
        const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
        const customName = `Voice Note ${dateStr}`;

        const savedRecord = await saveFile({
          file: audioBlob,
          customName,
          duration,
        });

        if (savedRecord) {
          onFilesChange([...attachedFiles, savedRecord]);
        }
        setRecordSeconds(0);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or unavailable.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Don't save
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      setRecordSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  async function handleRemove(id) {
    await deleteFile(id);
    onFilesChange(attachedFiles.filter((f) => f.id !== id));
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <div style={styles.container}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileAdd(e.target.files)}
        multiple
        accept="image/*,audio/*,.pdf,.txt,.doc,.docx"
        style={{ display: "none" }}
      />

      <div
        style={{
          ...styles.dropZone,
          ...(isDragging ? styles.dropZoneActive : {}),
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div style={styles.actionRow}>
          <button
            type="button"
            style={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isRecording}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Attach Files or Photos
          </button>

          {!isRecording ? (
            <button
              type="button"
              style={styles.recordBtn}
              onClick={startRecording}
              disabled={uploading}
            >
              <span style={styles.recordDot} />
              Record Voice Note
            </button>
          ) : (
            <div style={styles.recordingControls}>
              <span style={styles.liveBadge}>
                <span style={styles.pulseDot} />
                {formatTime(recordSeconds)}
              </span>
              <button type="button" style={styles.saveRecordBtn} onClick={stopRecording}>
                Done & Save
              </button>
              <button type="button" style={styles.cancelRecordBtn} onClick={cancelRecording}>
                Cancel
              </button>
            </div>
          )}
        </div>

        <p style={styles.hint}>
          Drag and drop images, audio notes, or documents. Stored 100% privately on your browser.
        </p>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      {attachedFiles.length > 0 && (
        <div style={styles.fileList}>
          {attachedFiles.map((file) => (
            <div key={file.id} style={styles.fileChip}>
              {file.type === "image" ? (
                <img src={file.dataUrl} alt={file.name} style={styles.thumb} />
              ) : file.type === "audio" ? (
                <span style={styles.iconAudio}>🎵</span>
              ) : (
                <span style={styles.iconDoc}>📄</span>
              )}
              <div style={styles.fileInfo}>
                <span style={styles.fileName}>{file.name}</span>
                <span style={styles.fileMeta}>
                  {formatBytes(file.size)}
                  {file.duration ? ` • ${formatTime(file.duration)}` : ""}
                </span>
              </div>
              <button
                type="button"
                style={styles.removeBtn}
                onClick={() => handleRemove(file.id)}
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: 10,
    marginBottom: 20,
  },
  dropZone: {
    padding: "16px 18px",
    background: "var(--surface)",
    border: "1px dashed var(--edge)",
    borderRadius: 8,
    textAlign: "center",
    transition: "border-color .2s, background .2s",
  },
  dropZoneActive: {
    borderColor: "var(--held)",
    background: "var(--surface-lift)",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 15px",
    background: "var(--surface-lift)",
    border: "1px solid var(--edge)",
    borderRadius: 6,
    color: "var(--text)",
    fontSize: 13.5,
    fontWeight: 500,
    transition: "background .15s",
  },
  recordBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 15px",
    background: "rgba(240, 181, 99, 0.1)",
    border: "1px solid var(--warm-dim)",
    borderRadius: 6,
    color: "var(--warm)",
    fontSize: 13.5,
    fontWeight: 500,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#E85D5D",
  },
  recordingControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  liveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "#2E1A1A",
    border: "1px solid #7D2A2A",
    borderRadius: 6,
    color: "#E87A7A",
    fontFamily: "monospace",
    fontSize: 13.5,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#E85D5D",
    animation: "breathe 1s infinite alternate",
  },
  saveRecordBtn: {
    padding: "6px 12px",
    background: "var(--warm)",
    color: "#241B0C",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
  },
  cancelRecordBtn: {
    padding: "6px 10px",
    color: "var(--muted)",
    fontSize: 13,
  },
  hint: {
    fontSize: 12.5,
    color: "var(--faint)",
    margin: 0,
  },
  errorText: {
    color: "#E88B7A",
    fontSize: 13,
    marginTop: 8,
  },
  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 12,
  },
  fileChip: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "9px 13px",
    background: "var(--surface)",
    border: "1px solid var(--edge)",
    borderRadius: 6,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 4,
    objectFit: "cover",
    border: "1px solid var(--edge-soft)",
  },
  iconAudio: { fontSize: 20 },
  iconDoc: { fontSize: 20 },
  fileInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  fileName: {
    fontSize: 13.5,
    color: "var(--text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  fileMeta: {
    fontSize: 11.5,
    color: "var(--faint)",
    marginTop: 2,
  },
  removeBtn: {
    padding: "4px 8px",
    color: "var(--faint)",
    fontSize: 14,
    borderRadius: 4,
    transition: "color .15s",
  },
};
