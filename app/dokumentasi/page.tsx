"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Huntap = {
  id: string;
  kode_huntap: string;
  nama_penerima: string;
  status: string | null;
  progress: number | null;
};

type Foto = {
  id: string;
  huntap_id: string;
  tahap: string;
  file_path: string;
  keterangan: string | null;
  uploaded_by: string | null;
  created_at: string;
  url?: string;
};

const tahapan = [
  "Belum Mulai",
  "Persiapan",
  "Pondasi",
  "Struktur",
  "Atap",
  "Finishing",
  "Selesai",
];

export default function DokumentasiPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const huntapIdDariUrl =
    searchParams.get("huntap_id");

  const [huntap, setHuntap] =
    useState<Huntap[]>([]);

  const [foto, setFoto] =
    useState<Foto[]>([]);

  const [huntapDipilih, setHuntapDipilih] =
    useState("");

  const [tahap, setTahap] =
    useState("Belum Mulai");

  const [keterangan, setKeterangan] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [deleting, setDeleting] =
    useState<string | null>(null);

  const [fotoPreview, setFotoPreview] =
    useState<Foto | null>(null);

  /*
  =====================================================
  AMBIL DATA HUNTAP
  =====================================================
  */

  async function ambilHuntap() {
    const {
      data,
      error,
    } = await supabase
      .from("huntap")
      .select(`
        id,
        kode_huntap,
        nama_penerima,
        status,
        progress
      `)
      .order("kode_huntap", {
        ascending: true,
      });

    if (error) {
      alert(
        "Gagal mengambil data Huntap: " +
          error.message
      );
      return;
    }

    const daftar =
      (data || []) as Huntap[];

    setHuntap(daftar);

    /*
    Jika halaman dibuka dari:

    /dokumentasi?huntap_id=UUID

    maka Huntap otomatis dipilih.
    */

    if (huntapIdDariUrl) {
      const ditemukan =
        daftar.find(
          (item) =>
            String(item.id) ===
            String(huntapIdDariUrl)
        );

      if (ditemukan) {
        setHuntapDipilih(
          String(ditemukan.id)
        );

        setTahap(
          ditemukan.status ||
            "Belum Mulai"
        );
      }
    }
  }

  /*
  =====================================================
  AMBIL FOTO
  =====================================================
  */

  async function ambilFoto(
    idHuntap?: string
  ) {
    const idYangDipakai =
      idHuntap || huntapDipilih;

    if (!idYangDipakai) {
      setFoto([]);
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("progress_photos")
      .select(`
        id,
        huntap_id,
        tahap,
        file_path,
        keterangan,
        uploaded_by,
        created_at
      `)
      .eq(
        "huntap_id",
        idYangDipakai
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      alert(
        "Gagal mengambil dokumentasi foto: " +
          error.message
      );
      return;
    }

    const daftarFoto =
      (data || []) as Foto[];

    /*
    Bucket dokumentasi bersifat PRIVATE.
    Kita membuat Signed URL agar foto
    bisa ditampilkan.
    */

    const fotoDenganUrl =
      await Promise.all(
        daftarFoto.map(
          async (item) => {
            const {
              data: signed,
              error:
                signedError,
            } =
              await supabase.storage
                .from("dokumentasi")
                .createSignedUrl(
                  item.file_path,
                  60 * 60
                );

            if (signedError) {
              console.error(
                "Gagal membuat Signed URL:",
                signedError
              );

              return item;
            }

            return {
              ...item,
              url: signed.signedUrl,
            };
          }
        )
      );

    setFoto(
      fotoDenganUrl
    );
  }

  /*
  =====================================================
  LOAD AWAL
  =====================================================
  */

  useEffect(() => {
    async function mulai() {
      setLoading(true);

      await ambilHuntap();

      setLoading(false);
    }

    mulai();
  }, [huntapIdDariUrl]);

  /*
  =====================================================
  KETIKA HUNTAP DIPILIH
  =====================================================
  */

  useEffect(() => {
    if (!huntapDipilih) {
      setFoto([]);
      return;
    }

    const ditemukan =
      huntap.find(
        (item) =>
          String(item.id) ===
          String(huntapDipilih)
      );

    if (ditemukan) {
      setTahap(
        ditemukan.status ||
          "Belum Mulai"
      );
    }

    ambilFoto(
      huntapDipilih
    );
  }, [huntapDipilih]);

  /*
  =====================================================
  PILIH HUNTAP
  =====================================================
  */

  function pilihHuntap(
    nilai: string
  ) {
    setHuntapDipilih(nilai);

    const ditemukan =
      huntap.find(
        (item) =>
          String(item.id) ===
          String(nilai)
      );

    if (ditemukan) {
      setTahap(
        ditemukan.status ||
          "Belum Mulai"
      );
    }
  }

  /*
  =====================================================
  PILIH FILE
  =====================================================
  */

  function pilihFile(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      e.target.files?.[0];

    if (!selected) {
      setFile(null);
      return;
    }

    if (
      !selected.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Silakan pilih file gambar."
      );

      e.target.value = "";
      setFile(null);

      return;
    }

    setFile(selected);
  }

  /*
  =====================================================
  UPLOAD FOTO
  =====================================================
  */

  async function uploadFoto() {
    if (!huntapDipilih) {
      alert(
        "Silakan pilih Huntap terlebih dahulu."
      );
      return;
    }

    if (!file) {
      alert(
        "Silakan pilih foto terlebih dahulu."
      );
      return;
    }

    /*
    Pastikan Huntap benar-benar ada.
    */

    const huntapTerpilih =
      huntap.find(
        (item) =>
          String(item.id) ===
          String(huntapDipilih)
      );

    if (!huntapTerpilih) {
      alert(
        "Huntap yang dipilih tidak ditemukan."
      );
      return;
    }

    setUploading(true);

    /*
    ===================================================
    CEK USER LOGIN
    ===================================================
    */

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setUploading(false);

      alert(
        "Sesi login tidak ditemukan. Silakan login kembali."
      );

      return;
    }

    /*
    ===================================================
    BUAT NAMA FILE
    ===================================================
    */

    const extension =
      file.name.includes(".")
        ? file.name
            .split(".")
            .pop()
        : "jpg";

    const namaFile =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${extension}`;

    /*
    Folder berdasarkan ID Huntap:

    dokumentasi/
      UUID-HUNTAP/
        foto.jpg
    */

    const filePath =
      `${huntapDipilih}/${namaFile}`;

    /*
    ===================================================
    UPLOAD KE STORAGE
    ===================================================
    */

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("dokumentasi")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

    if (uploadError) {
      setUploading(false);

      alert(
        "Gagal upload foto: " +
          uploadError.message
      );

      return;
    }

    /*
    ===================================================
    SIMPAN DATA KE progress_photos
    ===================================================
    */

    const {
      error: databaseError,
    } =
      await supabase
        .from("progress_photos")
        .insert({
          huntap_id:
            huntapDipilih,

          tahap:
            tahap,

          file_path:
            filePath,

          keterangan:
            keterangan.trim() ||
            null,

          uploaded_by:
            user.id,
        });

    /*
    Jika database gagal,
    hapus file yang sudah ter-upload
    dari Storage.
    */

    if (databaseError) {
      await supabase.storage
        .from("dokumentasi")
        .remove([
          filePath,
        ]);

      setUploading(false);

      alert(
        "Data foto gagal disimpan: " +
          databaseError.message
      );

      return;
    }

    /*
    ===================================================
    BERHASIL
    ===================================================
    */

    setUploading(false);

    setFile(null);
    setKeterangan("");

    const input =
      document.getElementById(
        "foto-input"
      ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }

    alert(
      "Dokumentasi foto berhasil diupload."
    );

    /*
    Refresh galeri otomatis.
    */

    await ambilFoto(
      huntapDipilih
    );
  }

  /*
  =====================================================
  HAPUS FOTO
  =====================================================
  */

  async function hapusFoto(
    item: Foto
  ) {
    const yakin =
      window.confirm(
        "Yakin ingin menghapus foto ini?"
      );

    if (!yakin) {
      return;
    }

    setDeleting(item.id);

    /*
    Hapus file dari Storage
    */

    const {
      error: storageError,
    } =
      await supabase.storage
        .from("dokumentasi")
        .remove([
          item.file_path,
        ]);

    if (storageError) {
      setDeleting(null);

      alert(
        "Gagal menghapus file: " +
          storageError.message
      );

      return;
    }

    /*
    Hapus data dari database.
    */

    const {
      error: databaseError,
    } =
      await supabase
        .from("progress_photos")
        .delete()
        .eq(
          "id",
          item.id
        );

    if (databaseError) {
      setDeleting(null);

      alert(
        "File sudah dihapus dari Storage, tetapi data database gagal dihapus: " +
          databaseError.message
      );

      return;
    }

    setDeleting(null);

    alert(
      "Dokumentasi foto berhasil dihapus."
    );

    await ambilFoto(
      huntapDipilih
    );
  }

  /*
  =====================================================
  HUNTAP TERPILIH
  =====================================================
  */

  const huntapTerpilih =
    huntap.find(
      (item) =>
        String(item.id) ===
        String(huntapDipilih)
    );

  /*
  =====================================================
  LOADING
  =====================================================
  */

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loading}>
            Memuat Dokumentasi Foto...
          </div>
        </div>
      </main>
    );
  }

  /*
  =====================================================
  TAMPILAN
  =====================================================
  */

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>

          <h1 style={styles.title}>
            Dokumentasi Foto
          </h1>

          <p style={styles.subtitle}>
            RHODAS CAB. ACEH TIMUR
          </p>

        </div>

        {/* FORM UPLOAD */}

        <section style={styles.card}>

          <h2 style={styles.cardTitle}>
            Upload Dokumentasi
          </h2>

          <p style={styles.description}>
            Simpan foto perkembangan pembangunan
            berdasarkan Huntap.
          </p>

          <div style={styles.formGrid}>

            {/* HUNTAP */}

            <div style={styles.formGroup}>

              <label style={styles.label}>
                Huntap
              </label>

              <select
                value={
                  huntapDipilih
                }
                onChange={(e) =>
                  pilihHuntap(
                    e.target.value
                  )
                }
                style={styles.select}
                disabled={uploading}
              >

                <option value="">
                  -- Pilih Huntap --
                </option>

                {huntap.map(
                  (item) => (
                    <option
                      key={
                        item.id
                      }
                      value={
                        String(
                          item.id
                        )
                      }
                    >
                      {
                        item.kode_huntap
                      }{" "}
                      -{" "}
                      {
                        item.nama_penerima
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            {/* TAHAP */}

            <div style={styles.formGroup}>

              <label style={styles.label}>
                Tahap Pembangunan
              </label>

              <select
                value={tahap}
                onChange={(e) =>
                  setTahap(
                    e.target.value
                  )
                }
                style={styles.select}
                disabled={
                  uploading ||
                  !huntapDipilih
                }
              >

                {tahapan.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* FOTO */}

            <div style={styles.formGroup}>

              <label style={styles.label}>
                Foto
              </label>

              <input
                id="foto-input"
                type="file"
                accept="image/*"
                onChange={
                  pilihFile
                }
                style={
                  styles.fileInput
                }
                disabled={
                  uploading ||
                  !huntapDipilih
                }
              />

              {file && (
                <div style={styles.fileInfo}>
                  File dipilih:{" "}
                  <strong>
                    {file.name}
                  </strong>
                </div>
              )}

            </div>

            {/* KETERANGAN */}

            <div style={styles.formGroup}>

              <label style={styles.label}>
                Keterangan
              </label>

              <input
                type="text"
                value={
                  keterangan
                }
                onChange={(e) =>
                  setKeterangan(
                    e.target.value
                  )
                }
                placeholder="Contoh: Pekerjaan pondasi rumah..."
                style={styles.input}
                disabled={
                  uploading ||
                  !huntapDipilih
                }
              />

            </div>

          </div>

          {/* INFO HUNTAP */}

          {huntapTerpilih && (
            <div style={styles.infoBox}>

              <strong>
                {
                  huntapTerpilih.kode_huntap
                }
              </strong>

              {" — "}

              {
                huntapTerpilih.nama_penerima
              }

              {" | Progress: "}

              <strong>
                {
                  Number(
                    huntapTerpilih.progress ||
                      0
                  )
                }
                %
              </strong>

            </div>
          )}

          {/* BUTTON */}

          <div style={styles.buttonArea}>

            <button
              onClick={
                uploadFoto
              }
              disabled={
                uploading ||
                !huntapDipilih ||
                !file
              }
              style={{
                ...styles.uploadButton,
                opacity:
                  uploading ||
                  !huntapDipilih ||
                  !file
                    ? 0.6
                    : 1,
              }}
            >
              {uploading
                ? "Mengupload..."
                : "📸 Upload Foto"}
            </button>

          </div>

        </section>

        {/* GALERI */}

        <section style={styles.card}>

          <div style={styles.galleryHeader}>

            <div>

              <h2 style={styles.cardTitle}>
                Galeri Dokumentasi
              </h2>

              {huntapTerpilih && (
                <p
                  style={
                    styles.gallerySubtitle
                  }
                >
                  {
                    huntapTerpilih.kode_huntap
                  }{" "}
                  -{" "}
                  {
                    huntapTerpilih.nama_penerima
                  }
                </p>
              )}

            </div>

            {huntapDipilih && (
              <div
                style={
                  styles.photoCount
                }
              >
                {foto.length} foto
              </div>
            )}

          </div>

          {!huntapDipilih ? (

            <div style={styles.empty}>
              Pilih Huntap terlebih dahulu
              untuk melihat dokumentasi.
            </div>

          ) : foto.length === 0 ? (

            <div style={styles.empty}>
              Belum ada dokumentasi foto
              untuk Huntap ini.
            </div>

          ) : (

            <div style={styles.gallery}>

              {foto.map(
                (item) => (

                  <div
                    key={
                      item.id
                    }
                    style={
                      styles.photoCard
                    }
                  >

                    {/* FOTO */}

                    <div
                      style={
                        styles.imageWrapper
                      }
                      onClick={() =>
                        setFotoPreview(
                          item
                        )
                      }
                    >

                      {item.url ? (

                        <img
                          src={
                            item.url
                          }
                          alt={
                            item.keterangan ||
                            "Dokumentasi Huntap"
                          }
                          style={
                            styles.image
                          }
                        />

                      ) : (

                        <div
                          style={
                            styles.imageError
                          }
                        >
                          Foto tidak dapat
                          ditampilkan
                        </div>

                      )}

                    </div>

                    {/* INFORMASI */}

                    <div
                      style={
                        styles.photoInfo
                      }
                    >

                      <div
                        style={
                          styles.photoStage
                        }
                      >
                        {
                          item.tahap
                        }
                      </div>

                      <div
                        style={
                          styles.photoDescription
                        }
                      >
                        {
                          item.keterangan ||
                          "Tidak ada keterangan"
                        }
                      </div>

                      <div
                        style={
                          styles.photoDate
                        }
                      >
                        {new Date(
                          item.created_at
                        ).toLocaleString(
                          "id-ID"
                        )}
                      </div>

                      <button
                        onClick={() =>
                          hapusFoto(
                            item
                          )
                        }
                        disabled={
                          deleting ===
                          item.id
                        }
                        style={
                          styles.deleteButton
                        }
                      >
                        {deleting ===
                        item.id
                          ? "Menghapus..."
                          : "Hapus"}
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>

      {/* MODAL FOTO */}

      {fotoPreview && (

        <div
          style={styles.modal}
          onClick={() =>
            setFotoPreview(
              null
            )
          }
        >

          <div
            style={
              styles.modalContent
            }
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              onClick={() =>
                setFotoPreview(
                  null
                )
              }
              style={
                styles.closeButton
              }
            >
              ✕
            </button>

            {fotoPreview.url && (

              <img
                src={
                  fotoPreview.url
                }
                alt={
                  fotoPreview.keterangan ||
                  "Dokumentasi"
                }
                style={
                  styles.modalImage
                }
              />

            )}

            <div
              style={
                styles.modalInfo
              }
            >

              <strong>
                {
                  fotoPreview.tahap
                }
              </strong>

              <p>
                {
                  fotoPreview.keterangan ||
                  "Tidak ada keterangan"
                }
              </p>

              <small>
                {new Date(
                  fotoPreview.created_at
                ).toLocaleString(
                  "id-ID"
                )}
              </small>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

/*
=========================================================
STYLE
=========================================================
*/

const styles: {
  [key: string]: React.CSSProperties;
} = {

  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  loading: {
    background: "white",
    padding: "50px",
    borderRadius: "14px",
    textAlign: "center",
    fontSize: "18px",
  },

  header: {
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "42px",
    fontWeight: 800,
    color: "#111827",
  },

  subtitle: {
    marginTop: "8px",
    color: "#666",
    fontSize: "19px",
  },

  card: {
    background: "white",
    border: "1px solid #e1e5eb",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "24px",
    boxSizing: "border-box",
  },

  cardTitle: {
    margin: "0 0 8px",
    fontSize: "27px",
    fontWeight: 700,
    color: "#111827",
  },

  description: {
    color: "#64748b",
    margin: "0 0 24px",
  },

  gallerySubtitle: {
    margin: 0,
    color: "#6b7280",
    fontSize: "15px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",
    gap: "22px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  label: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#374151",
  },

  select: {
    width: "100%",
    height: "52px",
    padding: "0 14px",
    border:
      "1px solid #d1d5db",
    borderRadius: "9px",
    background: "white",
    fontSize: "16px",
    boxSizing: "border-box",
  },

  input: {
    width: "100%",
    height: "52px",
    padding: "0 14px",
    border:
      "1px solid #d1d5db",
    borderRadius: "9px",
    fontSize: "16px",
    boxSizing: "border-box",
  },

  fileInput: {
    width: "100%",
    padding: "14px",
    border:
      "1px dashed #cbd5e1",
    borderRadius: "9px",
    background: "#f8fafc",
    boxSizing: "border-box",
  },

  fileInfo: {
    fontSize: "14px",
    color: "#475569",
  },

  infoBox: {
    marginTop: "22px",
    padding: "16px 18px",
    background: "#eff6ff",
    border:
      "1px solid #bfdbfe",
    borderRadius: "10px",
    color: "#1e40af",
  },

  buttonArea: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "25px",
    paddingTop: "20px",
    borderTop:
      "1px solid #eee",
  },

  uploadButton: {
    border: "none",
    background: "#16a34a",
    color: "white",
    padding: "14px 25px",
    borderRadius: "9px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  galleryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },

  photoCount: {
    background: "#eff6ff",
    color: "#2563eb",
    padding: "8px 14px",
    borderRadius: "20px",
    fontWeight: 700,
  },

  gallery: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",
    gap: "22px",
  },

  photoCard: {
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
    background: "white",
  },

  imageWrapper: {
    width: "100%",
    height: "230px",
    background: "#f1f5f9",
    cursor: "pointer",
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  imageError: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "14px",
  },

  photoInfo: {
    padding: "15px",
  },

  photoStage: {
    display: "inline-block",
    background: "#f3f4f6",
    padding: "5px 9px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "10px",
  },

  photoDescription: {
    fontSize: "15px",
    color: "#374151",
    minHeight: "40px",
  },

  photoDate: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "10px",
    marginBottom: "12px",
  },

  deleteButton: {
    width: "100%",
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "9px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 600,
  },

  empty: {
    padding: "50px",
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: "10px",
    color: "#64748b",
    fontSize: "16px",
  },

  modal: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px",
    zIndex: 9999,
  },

  modalContent: {
    position: "relative",
    maxWidth: "1000px",
    width: "100%",
    maxHeight: "90vh",
    background: "white",
    borderRadius: "14px",
    overflow: "auto",
    padding: "15px",
    boxSizing: "border-box",
  },

  modalImage: {
    width: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
    display: "block",
    background: "#111",
  },

  modalInfo: {
    padding: "15px 5px 5px",
    color: "#374151",
  },

  closeButton: {
    position: "absolute",
    right: "20px",
    top: "20px",
    zIndex: 2,
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "50%",
    background:
      "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 700,
  },
};