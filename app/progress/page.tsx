"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Huntap = {
  id: number;
  kode_huntap: string;
  nama_penerima: string;
  status: string | null;
  progress: number | null;
};

type ProgressHuntap = {
  id: number;
  huntap_id: number;
  progress: number;
  tahap: string;
  catatan: string | null;
  updated_by: string | null;
  created_at: string;
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

export default function ProgressPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  /*
    Ambil huntap_id dari URL.

    Contoh:
    /progress?huntap_id=1
  */
  const huntapIdDariUrl =
    searchParams.get("huntap_id");

  const [huntap, setHuntap] = useState<Huntap[]>([]);
  const [riwayat, setRiwayat] =
    useState<ProgressHuntap[]>([]);

  /*
    ID yang dipilih sengaja disimpan sebagai STRING
    agar konsisten dengan nilai dari URL dan select.
  */
  const [huntapDipilih, setHuntapDipilih] =
    useState("");

  const [progress, setProgress] =
    useState(0);

  const [tahap, setTahap] =
    useState("Belum Mulai");

  const [catatan, setCatatan] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /*
    =====================================================
    AMBIL DATA
    =====================================================
  */

  async function ambilData() {
    setLoading(true);

    /*
      Ambil semua Huntap
    */
    const {
      data: dataHuntap,
      error: errorHuntap,
    } = await supabase
      .from("huntap")
      .select(
        `
        id,
        kode_huntap,
        nama_penerima,
        status,
        progress
        `
      )
      .order("kode_huntap", {
        ascending: true,
      });

    if (errorHuntap) {
      alert(
        "Gagal mengambil data Huntap: " +
          errorHuntap.message
      );

      setLoading(false);
      return;
    }

    const daftarHuntap =
      (dataHuntap || []) as Huntap[];

    setHuntap(daftarHuntap);

    /*
      Ambil riwayat progress
    */
    const {
      data: dataRiwayat,
      error: errorRiwayat,
    } = await supabase
      .from("progress_huntap")
      .select(
        `
        id,
        huntap_id,
        progress,
        tahap,
        catatan,
        updated_by,
        created_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (errorRiwayat) {
      alert(
        "Gagal mengambil riwayat progress: " +
          errorRiwayat.message
      );

      setLoading(false);
      return;
    }

    setRiwayat(
      (dataRiwayat ||
        []) as ProgressHuntap[]
    );

    /*
      =====================================================
      OTOMATIS PILIH HUNTAP DARI URL
      =====================================================

      Kita TIDAK menggunakan Number()
      untuk ID pilihan.

      Kita membandingkan semuanya sebagai String.
    */

    if (huntapIdDariUrl) {
      const ditemukan =
        daftarHuntap.find(
          (item) =>
            String(item.id) ===
            String(huntapIdDariUrl)
        );

      if (ditemukan) {
        setHuntapDipilih(
          String(ditemukan.id)
        );

        setProgress(
          Number(
            ditemukan.progress || 0
          )
        );

        setTahap(
          ditemukan.status ||
            "Belum Mulai"
        );

        setCatatan("");
      }
    }

    setLoading(false);
  }

  /*
    Jalankan ketika halaman pertama dibuka
    atau parameter huntap_id berubah.
  */
  useEffect(() => {
    ambilData();
  }, [huntapIdDariUrl]);

  /*
    =====================================================
    PILIH HUNTAP DARI DROPDOWN
    =====================================================
  */

  function pilihHuntap(
    nilai: string
  ) {
    setHuntapDipilih(nilai);

    if (!nilai) {
      setProgress(0);
      setTahap("Belum Mulai");
      setCatatan("");
      return;
    }

    const ditemukan =
      huntap.find(
        (item) =>
          String(item.id) ===
          String(nilai)
      );

    if (!ditemukan) {
      return;
    }

    setProgress(
      Number(
        ditemukan.progress || 0
      )
    );

    setTahap(
      ditemukan.status ||
        "Belum Mulai"
    );

    setCatatan("");
  }

  /*
    =====================================================
    PERUBAHAN PROGRESS
    =====================================================
  */

  function progressBerubah(
    nilai: number
  ) {
    setProgress(nilai);

    if (nilai >= 100) {
      setTahap("Selesai");
    } else if (
      tahap === "Selesai" &&
      nilai < 100
    ) {
      setTahap("Finishing");
    }
  }

  /*
    =====================================================
    SIMPAN PROGRESS
    =====================================================
  */

  async function simpanProgress() {
    /*
      Pastikan Huntap dipilih.
    */
    if (
      !huntapDipilih ||
      huntapDipilih.trim() === ""
    ) {
      alert(
        "Silakan pilih Huntap terlebih dahulu."
      );
      return;
    }

    /*
      ID tetap STRING.
    */
    const idHuntap =
      huntapDipilih.trim();

    /*
      Pastikan ID tersebut memang
      ada di daftar Huntap.
    */
    const huntapValid =
      huntap.find(
        (item) =>
          String(item.id) ===
          String(idHuntap)
      );

    if (!huntapValid) {
      alert(
        "Huntap yang dipilih tidak ditemukan."
      );
      return;
    }

    setSaving(true);

    /*
      ===================================================
      AMBIL USER LOGIN
      ===================================================
    */

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);

      alert(
        "Sesi login tidak ditemukan. Silakan login kembali."
      );

      return;
    }

    /*
      ===================================================
      SIMPAN RIWAYAT
      ===================================================
    */

    const {
      error: errorRiwayat,
    } = await supabase
      .from("progress_huntap")
      .insert({
        /*
          Supabase menerima ID Huntap
          sebagai nilai yang sesuai dengan
          kolom huntap_id.
        */
        huntap_id: idHuntap,

        progress: Number(progress),

        tahap: tahap,

        catatan:
          catatan.trim() || null,

        updated_by: user.id,
      });

    if (errorRiwayat) {
      setSaving(false);

      alert(
        "Gagal menyimpan riwayat progress: " +
          errorRiwayat.message
      );

      return;
    }

    /*
      ===================================================
      UPDATE DATA HUNTAP
      ===================================================
    */

    const {
      error: errorUpdate,
    } = await supabase
      .from("huntap")
      .update({
        progress: Number(progress),

        status: tahap,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", idHuntap);

    if (errorUpdate) {
      setSaving(false);

      alert(
        "Riwayat progress berhasil disimpan, tetapi data Huntap gagal diperbarui: " +
          errorUpdate.message
      );

      return;
    }

    /*
      ===================================================
      BERHASIL
      ===================================================
    */

    setSaving(false);

    alert(
      "Progress Huntap berhasil disimpan."
    );

    setCatatan("");

    /*
      Ambil data terbaru.
    */
    await ambilData();
  }

  /*
    =====================================================
    HUNTAP YANG SEDANG DIPILIH
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
    RIWAYAT UNTUK HUNTAP TERPILIH
    =====================================================
  */

  const riwayatHuntap =
    riwayat.filter(
      (item) =>
        String(item.huntap_id) ===
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
            Memuat data progress...
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
            Progress Pembangunan
          </h1>

          <p style={styles.subtitle}>
            RHODAS CAB. ACEH TIMUR
          </p>
        </div>

        {/* FORM UPDATE */}

        <section style={styles.card}>

          <h2 style={styles.cardTitle}>
            Update Progress Huntap
          </h2>

          <p style={styles.description}>
            Pilih Huntap kemudian masukkan
            perkembangan pembangunan terbaru.
          </p>

          {/* PILIH HUNTAP */}

          <div style={styles.formGroupFull}>

            <label style={styles.label}>
              Huntap
            </label>

            <select
              value={huntapDipilih}
              onChange={(e) =>
                pilihHuntap(
                  e.target.value
                )
              }
              style={styles.select}
              disabled={saving}
            >

              <option value="">
                -- Pilih Huntap --
              </option>

              {huntap.map(
                (item) => (
                  <option
                    key={item.id}
                    value={String(
                      item.id
                    )}
                  >
                    {item.kode_huntap} -{" "}
                    {item.nama_penerima}
                  </option>
                )
              )}

            </select>

          </div>

          {/* INFORMASI HUNTAP */}

          {huntapTerpilih && (
            <div
              style={
                styles.selectedHuntap
              }
            >

              <div>
                <span
                  style={
                    styles.selectedLabel
                  }
                >
                  Kode Huntap
                </span>

                <strong
                  style={
                    styles.selectedValue
                  }
                >
                  {
                    huntapTerpilih.kode_huntap
                  }
                </strong>
              </div>

              <div>
                <span
                  style={
                    styles.selectedLabel
                  }
                >
                  Nama Penerima
                </span>

                <strong
                  style={
                    styles.selectedValue
                  }
                >
                  {
                    huntapTerpilih.nama_penerima
                  }
                </strong>
              </div>

              <div>
                <span
                  style={
                    styles.selectedLabel
                  }
                >
                  Progress Saat Ini
                </span>

                <strong
                  style={
                    styles.selectedProgress
                  }
                >
                  {
                    Number(
                      huntapTerpilih.progress ||
                        0
                    )
                  }
                  %
                </strong>
              </div>

            </div>
          )}

          {/* FORM */}

          <div style={styles.formGrid}>

            {/* PROGRESS */}

            <div style={styles.formGroup}>

              <label style={styles.label}>
                Progress Pembangunan
              </label>

              <div
                style={
                  styles.progressInputRow
                }
              >

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) =>
                    progressBerubah(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  style={
                    styles.rangeInput
                  }
                  disabled={
                    saving ||
                    !huntapDipilih
                  }
                />

                <div
                  style={
                    styles.progressNumber
                  }
                >
                  {progress}%
                </div>

              </div>

              <div
                style={
                  styles.progressBackground
                }
              >

                <div
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min(
                      Math.max(
                        progress,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />

              </div>

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
                  saving ||
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

            {/* CATATAN */}

            <div
              style={
                styles.formGroupFull
              }
            >

              <label style={styles.label}>
                Catatan
              </label>

              <textarea
                value={catatan}
                onChange={(e) =>
                  setCatatan(
                    e.target.value
                  )
                }
                placeholder="Masukkan catatan perkembangan pembangunan..."
                rows={4}
                style={
                  styles.textarea
                }
                disabled={
                  saving ||
                  !huntapDipilih
                }
              />

            </div>

          </div>

          {/* SIMPAN */}

          <div
            style={
              styles.buttonContainer
            }
          >

            <button
              onClick={
                simpanProgress
              }
              disabled={
                saving ||
                !huntapDipilih
              }
              style={{
                ...styles.saveButton,
                opacity:
                  saving ||
                  !huntapDipilih
                    ? 0.6
                    : 1,
              }}
            >
              {saving
                ? "Menyimpan..."
                : "Simpan Progress"}
            </button>

          </div>

        </section>

        {/* RIWAYAT */}

        <section style={styles.card}>

          <h2 style={styles.cardTitle}>
            Riwayat Progress
          </h2>

          {!huntapDipilih ? (
            <div style={styles.empty}>
              Pilih Huntap terlebih dahulu
              untuk melihat riwayat progress.
            </div>
          ) : riwayatHuntap.length === 0 ? (
            <div style={styles.empty}>
              Belum ada riwayat progress
              untuk Huntap ini.
            </div>
          ) : (
            <div
              style={
                styles.tableWrapper
              }
            >

              <table style={styles.table}>

                <thead>

                  <tr>

                    <th style={styles.th}>
                      No
                    </th>

                    <th style={styles.th}>
                      Tanggal
                    </th>

                    <th style={styles.th}>
                      Progress
                    </th>

                    <th style={styles.th}>
                      Tahap
                    </th>

                    <th style={styles.th}>
                      Catatan
                    </th>

                    <th style={styles.th}>
                      User
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {riwayatHuntap.map(
                    (
                      item,
                      index
                    ) => (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td
                          style={
                            styles.td
                          }
                        >
                          {index + 1}
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {new Date(
                            item.created_at
                          ).toLocaleString(
                            "id-ID"
                          )}
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong>
                            {
                              item.progress
                            }
                            %
                          </strong>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <span
                            style={
                              styles.badge
                            }
                          >
                            {
                              item.tahap
                            }
                          </span>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {
                            item.catatan ||
                            "-"
                          }
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {
                            item.updated_by ||
                            "-"
                          }
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>
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
    padding: "40px",
    borderRadius: "12px",
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
    fontSize: "20px",
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
    margin: "0 0 18px",
    fontSize: "28px",
    fontWeight: 600,
    color: "#111827",
  },

  description: {
    color: "#666",
    margin: "0 0 25px",
    fontSize: "16px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",
    gap: "24px",
    marginTop: "24px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  formGroupFull: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  label: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#374151",
  },

  select: {
    width: "100%",
    height: "54px",
    padding: "0 15px",
    border:
      "1px solid #d1d5db",
    borderRadius: "9px",
    background: "white",
    fontSize: "16px",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    padding: "14px",
    border:
      "1px solid #d1d5db",
    borderRadius: "9px",
    fontSize: "16px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  selectedHuntap: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",
    gap: "18px",
    marginTop: "24px",
    padding: "20px",
    background: "#eff6ff",
    border:
      "1px solid #bfdbfe",
    borderRadius: "12px",
  },

  selectedLabel: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "7px",
  },

  selectedValue: {
    display: "block",
    fontSize: "18px",
    color: "#111827",
  },

  selectedProgress: {
    display: "block",
    fontSize: "24px",
    fontWeight: 800,
    color: "#2563eb",
  },

  progressInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },

  rangeInput: {
    flex: 1,
    width: "100%",
    cursor: "pointer",
  },

  progressNumber: {
    width: "80px",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: 800,
    color: "#2563eb",
  },

  progressBackground: {
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "12px",
  },

  progressFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
    transition:
      "width 0.2s ease",
  },

  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "28px",
    paddingTop: "22px",
    borderTop:
      "1px solid #eee",
  },

  saveButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "15px 28px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 700,
  },

  empty: {
    padding: "45px",
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: "10px",
    color: "#666",
    fontSize: "17px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },

  th: {
    textAlign: "left",
    padding: "15px 14px",
    background: "#f3f4f6",
    borderBottom:
      "1px solid #ddd",
    fontSize: "15px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  td: {
    padding: "15px 14px",
    borderBottom:
      "1px solid #eee",
    fontSize: "15px",
    verticalAlign: "middle",
  },

  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "7px",
    background: "#f3f4f6",
    fontSize: "14px",
    fontWeight: 600,
  },
};