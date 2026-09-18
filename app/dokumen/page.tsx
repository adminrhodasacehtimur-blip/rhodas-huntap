"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Huntap = {
  id: string;
  kode_huntap: string | null;
  nomor_unit: string | null;
  nama_penerima: string | null;
  desa: string | null;
  kecamatan: string | null;
  kontraktor_id: number | null;
};

type Dokumen = {
  id: number;
  kontraktor_id: number | null;
  huntap_id: string;
  jenis_dokumen: string | null;
  nama_dokumen: string | null;
  nomor_dokumen: string | null;
  tanggal_dokumen: string | null;
  keterangan: string | null;
  nama_file: string | null;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const supabase = createClient();

const jenisDokumenOptions = [
  "Kontrak",
  "SPPR",
  "BAST",
  "BA Progress",
  "SPM",
  "Addendum",
  "Surat Perintah Kerja",
  "Dokumen Teknis",
  "Dokumen Administrasi",
  "Lainnya",
];

export default function DokumenPage() {
  const [huntapList, setHuntapList] = useState<Huntap[]>([]);
  const [dokumenList, setDokumenList] = useState<Dokumen[]>([]);

  const [huntapId, setHuntapId] = useState("");
  const [huntapTerpilih, setHuntapTerpilih] = useState<Huntap | null>(null);

  const [jenisDokumen, setJenisDokumen] = useState("");
  const [namaDokumen, setNamaDokumen] = useState("");
  const [nomorDokumen, setNomorDokumen] = useState("");
  const [tanggalDokumen, setTanggalDokumen] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const [loadingHuntap, setLoadingHuntap] = useState(true);
  const [loadingDokumen, setLoadingDokumen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // AMBIL HUNTAP
  // ============================================================
  useEffect(() => {
    loadHuntap();

    // Jika halaman dibuka dari link:
    // /dokumen?huntap_id=xxxx
    const params = new URLSearchParams(window.location.search);
    const idDariUrl = params.get("huntap_id");

    if (idDariUrl) {
      setHuntapId(idDariUrl);
    }
  }, []);

  // ============================================================
  // LOAD HUNTAP
  // ============================================================
  async function loadHuntap() {
    setLoadingHuntap(true);
    setError("");

    const { data, error } = await supabase
      .from("huntap")
      .select(
        "id, kode_huntap, nomor_unit, nama_penerima, desa, kecamatan, kontraktor_id"
      )
      .order("kode_huntap", { ascending: true });

    if (error) {
      console.error(error);
      setError("Gagal mengambil data Huntap: " + error.message);
      setLoadingHuntap(false);
      return;
    }

    setHuntapList((data || []) as Huntap[]);
    setLoadingHuntap(false);
  }

  // ============================================================
  // SAAT HUNTAP DIPILIH
  // ============================================================
  useEffect(() => {
    if (!huntapId) {
      setHuntapTerpilih(null);
      setDokumenList([]);
      return;
    }

    const item = huntapList.find(
      (huntap) => String(huntap.id) === String(huntapId)
    );

    setHuntapTerpilih(item || null);

    if (item) {
      loadDokumen(item.id);
    }
  }, [huntapId, huntapList]);

  // ============================================================
  // LOAD DOKUMEN
  // ============================================================
  async function loadDokumen(id: string) {
    setLoadingDokumen(true);
    setError("");

    const { data, error } = await supabase
      .from("dokumen_huntap")
      .select(
        `
        id,
        kontraktor_id,
        huntap_id,
        jenis_dokumen,
        nama_dokumen,
        nomor_dokumen,
        tanggal_dokumen,
        keterangan,
        nama_file,
        file_path,
        file_size,
        file_type,
        created_at,
        updated_at
        `
      )
      .eq("huntap_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("Gagal mengambil dokumen: " + error.message);
      setDokumenList([]);
      setLoadingDokumen(false);
      return;
    }

    setDokumenList((data || []) as Dokumen[]);
    setLoadingDokumen(false);
  }

  // ============================================================
  // PILIH FILE
  // ============================================================
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setMessage("");

    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
    ];

    const namaFile = selectedFile.name.toLowerCase();

    const extensionDiizinkan = allowedExtensions.some((ext) =>
      namaFile.endsWith(ext)
    );

    if (!extensionDiizinkan) {
      setError(
        "Jenis file belum didukung. Gunakan PDF, JPG, JPEG, PNG, DOC, DOCX, XLS atau XLSX."
      );
      e.target.value = "";
      setFile(null);
      return;
    }

    // Batas 20 MB
    const maxSize = 20 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("Ukuran file maksimal 20 MB.");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);

    // Jika nama dokumen kosong, otomatis isi dari nama file
    if (!namaDokumen.trim()) {
      const namaTanpaExtension = selectedFile.name.replace(/\.[^/.]+$/, "");
      setNamaDokumen(namaTanpaExtension);
    }
  }

  // ============================================================
  // FORMAT UKURAN FILE
  // ============================================================
  function formatFileSize(size: number | null) {
    if (!size) return "-";

    if (size < 1024) {
      return size + " B";
    }

    if (size < 1024 * 1024) {
      return (size / 1024).toFixed(1) + " KB";
    }

    return (size / (1024 * 1024)).toFixed(1) + " MB";
  }

  // ============================================================
  // FORMAT TANGGAL
  // ============================================================
  function formatTanggal(tanggal: string | null) {
    if (!tanggal) return "-";

    const date = new Date(tanggal);

    if (Number.isNaN(date.getTime())) {
      return tanggal;
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // ============================================================
  // UPLOAD DOKUMEN
  // ============================================================
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!huntapTerpilih) {
      setError("Silakan pilih Huntap terlebih dahulu.");
      return;
    }

    if (!jenisDokumen) {
      setError("Silakan pilih jenis dokumen.");
      return;
    }

    if (!namaDokumen.trim()) {
      setError("Nama dokumen wajib diisi.");
      return;
    }

    if (!file) {
      setError("Silakan pilih file dokumen.");
      return;
    }

    if (huntapTerpilih.kontraktor_id === null) {
      setError(
        "Huntap ini belum memiliki kontraktor. Dokumen belum dapat disimpan."
      );
      return;
    }

    setUploading(true);

    try {
      // ----------------------------------------------------------
      // CEK LOGIN
      // ----------------------------------------------------------
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Anda belum login.");
      }

      // ----------------------------------------------------------
      // BERSIHKAN NAMA FILE
      // ----------------------------------------------------------
      const namaFileAman = file.name
        .replace(/[^\w.\- ]+/g, "")
        .replace(/\s+/g, "_");

      const namaFileStorage = `${Date.now()}_${namaFileAman}`;

      // Folder menggunakan kode Huntap
      const folderHuntap =
        huntapTerpilih.kode_huntap || String(huntapTerpilih.id);

      const filePath = `${folderHuntap}/${namaFileStorage}`;

      // ----------------------------------------------------------
      // UPLOAD KE STORAGE
      // ----------------------------------------------------------
      const { error: uploadError } = await supabase.storage
        .from("dokumen")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) {
        throw new Error(
          "Gagal upload file ke Storage: " + uploadError.message
        );
      }

      // ----------------------------------------------------------
      // SIMPAN DATA KE TABEL
      // ----------------------------------------------------------
      const { error: insertError } = await supabase
        .from("dokumen_huntap")
        .insert({
          kontraktor_id: huntapTerpilih.kontraktor_id,
          huntap_id: huntapTerpilih.id,
          jenis_dokumen: jenisDokumen,
          nama_dokumen: namaDokumen.trim(),
          nomor_dokumen: nomorDokumen.trim() || null,
          tanggal_dokumen: tanggalDokumen || null,
          keterangan: keterangan.trim() || null,
          nama_file: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type || null,
        });

      if (insertError) {
        // Jika tabel gagal disimpan, hapus file yang sudah terupload
        await supabase.storage.from("dokumen").remove([filePath]);

        throw new Error(
          "File berhasil diupload tetapi data dokumen gagal disimpan: " +
            insertError.message
        );
      }

      // ----------------------------------------------------------
      // BERHASIL
      // ----------------------------------------------------------
      setMessage("Dokumen berhasil diupload.");

      setJenisDokumen("");
      setNamaDokumen("");
      setNomorDokumen("");
      setTanggalDokumen("");
      setKeterangan("");
      setFile(null);

      const inputFile = document.getElementById(
        "file-dokumen"
      ) as HTMLInputElement | null;

      if (inputFile) {
        inputFile.value = "";
      }

      await loadDokumen(huntapTerpilih.id);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan saat upload dokumen.");
    } finally {
      setUploading(false);
    }
  }

  // ============================================================
  // DOWNLOAD / LIHAT DOKUMEN
  // ============================================================
  async function handleViewDokumen(item: Dokumen) {
    setError("");
    setMessage("");

    if (!item.file_path) {
      setError("Lokasi file tidak tersedia.");
      return;
    }

    const { data, error } = await supabase.storage
      .from("dokumen")
      .createSignedUrl(item.file_path, 3600);

    if (error || !data?.signedUrl) {
      console.error(error);
      setError(
        "Gagal membuka dokumen: " +
          (error?.message || "URL dokumen tidak tersedia.")
      );
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  // ============================================================
  // HAPUS DOKUMEN
  // ============================================================
  async function handleDeleteDokumen(item: Dokumen) {
    setError("");
    setMessage("");

    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus dokumen "${item.nama_dokumen || item.nama_file}"?`
    );

    if (!yakin) {
      return;
    }

    try {
      // ----------------------------------------------------------
      // HAPUS FILE STORAGE
      // ----------------------------------------------------------
      if (item.file_path) {
        const { error: storageError } = await supabase.storage
          .from("dokumen")
          .remove([item.file_path]);

        if (storageError) {
          console.error(storageError);

          // Tetap coba hapus data tabel jika file storage
          // sudah tidak ditemukan
          if (!storageError.message.toLowerCase().includes("not found")) {
            throw new Error(
              "Gagal menghapus file dari Storage: " +
                storageError.message
            );
          }
        }
      }

      // ----------------------------------------------------------
      // HAPUS DATA TABEL
      // ----------------------------------------------------------
      const { error: deleteError } = await supabase
        .from("dokumen_huntap")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        throw new Error(
          "File Storage sudah diproses, tetapi data dokumen gagal dihapus: " +
            deleteError.message
        );
      }

      setMessage("Dokumen berhasil dihapus.");

      if (huntapTerpilih) {
        await loadDokumen(huntapTerpilih.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Gagal menghapus dokumen.");
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dokumen Huntap</h1>
            <p style={styles.subtitle}>
              Penyimpanan dan administrasi dokumen setiap Huntap
            </p>
          </div>

          <a href="/" style={styles.backButton}>
            ← Dashboard
          </a>
        </div>

        {/* PESAN */}
        {message && <div style={styles.success}>{message}</div>}

        {error && <div style={styles.error}>{error}</div>}

        {/* PILIH HUNTAP */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>1. Pilih Huntap</h2>

          {loadingHuntap ? (
            <p>Memuat data Huntap...</p>
          ) : (
            <select
              value={huntapId}
              onChange={(e) => setHuntapId(e.target.value)}
              style={styles.input}
            >
              <option value="">-- Pilih Huntap --</option>

              {huntapList.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.kode_huntap || "-"} — Unit{" "}
                  {item.nomor_unit || "-"} —{" "}
                  {item.nama_penerima || "-"}
                </option>
              ))}
            </select>
          )}

          {huntapTerpilih && (
            <div style={styles.huntapInfo}>
              <div>
                <strong>Kode Huntap</strong>
                <span>{huntapTerpilih.kode_huntap || "-"}</span>
              </div>

              <div>
                <strong>Nomor Unit</strong>
                <span>{huntapTerpilih.nomor_unit || "-"}</span>
              </div>

              <div>
                <strong>Penerima</strong>
                <span>{huntapTerpilih.nama_penerima || "-"}</span>
              </div>

              <div>
                <strong>Desa</strong>
                <span>{huntapTerpilih.desa || "-"}</span>
              </div>

              <div>
                <strong>Kecamatan</strong>
                <span>{huntapTerpilih.kecamatan || "-"}</span>
              </div>

              <div>
                <strong>Kontraktor ID</strong>
                <span>
                  {huntapTerpilih.kontraktor_id !== null
                    ? huntapTerpilih.kontraktor_id
                    : "-"}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* FORM UPLOAD */}
        {huntapTerpilih && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>2. Upload Dokumen</h2>

            <form onSubmit={handleUpload}>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Jenis Dokumen *</label>

                  <select
                    value={jenisDokumen}
                    onChange={(e) => setJenisDokumen(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">-- Pilih Jenis Dokumen --</option>

                    {jenisDokumenOptions.map((jenis) => (
                      <option key={jenis} value={jenis}>
                        {jenis}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Nama Dokumen *</label>

                  <input
                    type="text"
                    value={namaDokumen}
                    onChange={(e) => setNamaDokumen(e.target.value)}
                    placeholder="Contoh: BAST Pembangunan Huntap"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Nomor Dokumen</label>

                  <input
                    type="text"
                    value={nomorDokumen}
                    onChange={(e) => setNomorDokumen(e.target.value)}
                    placeholder="Contoh: 001/BAST/2026"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Tanggal Dokumen</label>

                  <input
                    type="date"
                    value={tanggalDokumen}
                    onChange={(e) => setTanggalDokumen(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fullWidth}>
                  <label style={styles.label}>Keterangan</label>

                  <textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Keterangan tambahan..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.fullWidth}>
                  <label style={styles.label}>File Dokumen *</label>

                  <input
                    id="file-dokumen"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    style={styles.fileInput}
                  />

                  <p style={styles.helpText}>
                    Format: PDF, JPG, JPEG, PNG, DOC, DOCX, XLS, XLSX.
                    Maksimal 20 MB.
                  </p>

                  {file && (
                    <div style={styles.selectedFile}>
                      <strong>File dipilih:</strong> {file.name}
                      <br />
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    ...styles.uploadButton,
                    opacity: uploading ? 0.6 : 1,
                    cursor: uploading ? "not-allowed" : "pointer",
                  }}
                >
                  {uploading ? "Mengupload..." : "↑ Upload Dokumen"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* DAFTAR DOKUMEN */}
        {huntapTerpilih && (
          <section style={styles.card}>
            <div style={styles.listHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  3. Daftar Dokumen Huntap
                </h2>

                <p style={styles.subtitle}>
                  {huntapTerpilih.kode_huntap || "-"} —{" "}
                  {huntapTerpilih.nama_penerima || "-"}
                </p>
              </div>

              <div style={styles.totalBadge}>
                {dokumenList.length} Dokumen
              </div>
            </div>

            {loadingDokumen ? (
              <p>Memuat daftar dokumen...</p>
            ) : dokumenList.length === 0 ? (
              <div style={styles.empty}>
                <div style={{ fontSize: 40 }}>📁</div>

                <strong>Belum ada dokumen</strong>

                <p>
                  Silakan upload dokumen untuk Huntap ini menggunakan form di
                  atas.
                </p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>No</th>
                      <th style={styles.th}>Jenis</th>
                      <th style={styles.th}>Nama Dokumen</th>
                      <th style={styles.th}>Nomor</th>
                      <th style={styles.th}>Tanggal</th>
                      <th style={styles.th}>File</th>
                      <th style={styles.th}>Ukuran</th>
                      <th style={styles.th}>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dokumenList.map((item, index) => (
                      <tr key={item.id}>
                        <td style={styles.td}>{index + 1}</td>

                        <td style={styles.td}>
                          <span style={styles.jenisBadge}>
                            {item.jenis_dokumen || "-"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <strong>{item.nama_dokumen || "-"}</strong>

                          {item.keterangan && (
                            <div style={styles.keterangan}>
                              {item.keterangan}
                            </div>
                          )}
                        </td>

                        <td style={styles.td}>
                          {item.nomor_dokumen || "-"}
                        </td>

                        <td style={styles.td}>
                          {formatTanggal(item.tanggal_dokumen)}
                        </td>

                        <td style={styles.td}>
                          <div style={styles.fileName}>
                            📄 {item.nama_file || "-"}
                          </div>
                        </td>

                        <td style={styles.td}>
                          {formatFileSize(item.file_size)}
                        </td>

                        <td style={styles.td}>
                          <div style={styles.actionGroup}>
                            <button
                              type="button"
                              onClick={() => handleViewDokumen(item)}
                              style={styles.viewButton}
                            >
                              Lihat
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDokumen(item)}
                              style={styles.deleteButton}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {!huntapTerpilih && !loadingHuntap && (
          <div style={styles.instruction}>
            <div style={{ fontSize: 48 }}>📂</div>

            <h3>Silakan pilih Huntap</h3>

            <p>
              Pilih Huntap terlebih dahulu untuk melihat dan mengelola
              dokumennya.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f7f9",
    padding: "30px 20px 60px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    color: "#1f2937",
  },

  container: {
    maxWidth: 1400,
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    marginBottom: 25,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: 14,
  },

  backButton: {
    textDecoration: "none",
    background: "#374151",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: 8,
    fontWeight: 700,
    display: "inline-block",
  },

  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    marginBottom: 22,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },

  sectionTitle: {
    margin: "0 0 18px",
    fontSize: 20,
    fontWeight: 800,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    resize: "vertical",
    fontFamily: "inherit",
  },

  label: {
    display: "block",
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 7,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18,
  },

  fullWidth: {
    gridColumn: "1 / -1",
  },

  fileInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    border: "1px dashed #9ca3af",
    borderRadius: 8,
    background: "#f9fafb",
  },

  helpText: {
    color: "#6b7280",
    fontSize: 12,
    margin: "7px 0 0",
  },

  selectedFile: {
    marginTop: 10,
    padding: 12,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: 8,
    fontSize: 13,
  },

  uploadButton: {
    border: 0,
    borderRadius: 8,
    padding: "12px 20px",
    background: "#059669",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
  },

  huntapInfo: {
    marginTop: 18,
    padding: 16,
    background: "#f8fafc",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },

  success: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
    padding: "13px 16px",
    borderRadius: 9,
    marginBottom: 18,
    fontWeight: 600,
  },

  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "13px 16px",
    borderRadius: 9,
    marginBottom: 18,
    fontWeight: 600,
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    marginBottom: 18,
    flexWrap: "wrap",
  },

  totalBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    padding: "8px 13px",
    borderRadius: 20,
    fontWeight: 800,
    fontSize: 13,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1050,
  },

  th: {
    background: "#f8fafc",
    borderBottom: "2px solid #e5e7eb",
    padding: "12px 10px",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "13px 10px",
    fontSize: 13,
    verticalAlign: "top",
  },

  jenisBadge: {
    display: "inline-block",
    background: "#eef2ff",
    color: "#3730a3",
    padding: "5px 9px",
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  keterangan: {
    marginTop: 5,
    color: "#6b7280",
    fontSize: 12,
    maxWidth: 280,
  },

  fileName: {
    maxWidth: 220,
    overflowWrap: "anywhere",
  },

  actionGroup: {
    display: "flex",
    gap: 7,
    flexWrap: "wrap",
  },

  viewButton: {
    border: 0,
    borderRadius: 7,
    padding: "8px 12px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  deleteButton: {
    border: 0,
    borderRadius: 7,
    padding: "8px 12px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "45px 20px",
    background: "#f8fafc",
    borderRadius: 10,
    color: "#6b7280",
  },

  instruction: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "60px 20px",
    textAlign: "center",
    color: "#6b7280",
  },
};