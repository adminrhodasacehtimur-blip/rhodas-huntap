"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Kontraktor = {
  id: number;
  jenis_perusahaan: string;
  nama_perusahaan: string;
  nama_direktur: string | null;
  nik_direktur: string | null;
  nib: string | null;
  npwp: string | null;
  alamat: string | null;
  no_telepon: string | null;
  email: string | null;
  nama_bank: string | null;
  no_rekening: string | null;
  atas_nama_rekening: string | null;
  no_kontrak: string | null;
  tanggal_kontrak: string | null;
  target_huntap: number;
  status: string;
  keterangan: string | null;
};

const formAwal = {
  jenis_perusahaan: "PT",
  nama_perusahaan: "",
  nama_direktur: "",
  nik_direktur: "",
  nib: "",
  npwp: "",
  alamat: "",
  no_telepon: "",
  email: "",
  nama_bank: "",
  no_rekening: "",
  atas_nama_rekening: "",
  no_kontrak: "",
  tanggal_kontrak: "",
  target_huntap: "30",
  status: "Aktif",
  keterangan: "",
};

export default function KontraktorPage() {
  const [data, setData] = useState<Kontraktor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState(formAwal);

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("kontraktor")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert("Gagal mengambil data kontraktor: " + error.message);
      setLoading(false);
      return;
    }

    setData(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function bukaTambah() {
    setEditId(null);
    setForm(formAwal);
    setShowForm(true);
  }

  function bukaEdit(item: Kontraktor) {
    setEditId(item.id);

    setForm({
      jenis_perusahaan: item.jenis_perusahaan || "PT",
      nama_perusahaan: item.nama_perusahaan || "",
      nama_direktur: item.nama_direktur || "",
      nik_direktur: item.nik_direktur || "",
      nib: item.nib || "",
      npwp: item.npwp || "",
      alamat: item.alamat || "",
      no_telepon: item.no_telepon || "",
      email: item.email || "",
      nama_bank: item.nama_bank || "",
      no_rekening: item.no_rekening || "",
      atas_nama_rekening: item.atas_nama_rekening || "",
      no_kontrak: item.no_kontrak || "",
      tanggal_kontrak: item.tanggal_kontrak || "",
      target_huntap: String(item.target_huntap ?? 30),
      status: item.status || "Aktif",
      keterangan: item.keterangan || "",
    });

    setShowForm(true);
  }

  function tutupForm() {
    setShowForm(false);
    setEditId(null);
    setForm(formAwal);
  }

  function ubahForm(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((sebelumnya) => ({
      ...sebelumnya,
      [name]: value,
    }));
  }

  async function simpanData(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nama_perusahaan.trim()) {
      alert("Nama perusahaan wajib diisi.");
      return;
    }

    setSaving(true);

    const payload = {
      jenis_perusahaan: form.jenis_perusahaan,
      nama_perusahaan: form.nama_perusahaan.trim(),
      nama_direktur: form.nama_direktur.trim() || null,
      nik_direktur: form.nik_direktur.trim() || null,
      nib: form.nib.trim() || null,
      npwp: form.npwp.trim() || null,
      alamat: form.alamat.trim() || null,
      no_telepon: form.no_telepon.trim() || null,
      email: form.email.trim() || null,
      nama_bank: form.nama_bank.trim() || null,
      no_rekening: form.no_rekening.trim() || null,
      atas_nama_rekening: form.atas_nama_rekening.trim() || null,
      no_kontrak: form.no_kontrak.trim() || null,
      tanggal_kontrak: form.tanggal_kontrak || null,
      target_huntap: Number(form.target_huntap) || 0,
      status: form.status,
      keterangan: form.keterangan.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let error;

    if (editId !== null) {
      const hasil = await supabase
        .from("kontraktor")
        .update(payload)
        .eq("id", editId);

      error = hasil.error;
    } else {
      const hasil = await supabase
        .from("kontraktor")
        .insert([payload]);

      error = hasil.error;
    }

    setSaving(false);

    if (error) {
      alert("Gagal menyimpan data: " + error.message);
      return;
    }

    alert(
      editId !== null
        ? "Data kontraktor berhasil diperbarui."
        : "Data kontraktor berhasil ditambahkan."
    );

    tutupForm();
    loadData();
  }

  async function hapusData(id: number, nama: string) {
    const yakin = confirm(
      `Apakah Anda yakin ingin menghapus data ${nama}?\n\nData perusahaan akan dihapus dari daftar kontraktor.`
    );

    if (!yakin) return;

    const { error } = await supabase
      .from("kontraktor")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus data: " + error.message);
      return;
    }

    alert("Data kontraktor berhasil dihapus.");
    loadData();
  }

  function tampilkanRekening(noRekening: string | null) {
    if (!noRekening) return "-";

    if (noRekening.length <= 4) {
      return noRekening;
    }

    return "••••••" + noRekening.slice(-4);
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Data Kontraktor</h1>
          <p style={styles.subtitle}>
            RHODAS CAB. ACEH TIMUR
          </p>
        </div>

        <button
          onClick={bukaTambah}
          style={styles.primaryButton}
        >
          + Tambah PT / CV
        </button>
      </div>

      <div style={styles.infoBox}>
        <strong>Informasi:</strong> Data PT/CV dapat ditambahkan
        kapan saja ketika kontraktor sudah ditentukan. Target Huntap
        default adalah 30 unit dan dapat diubah sesuai kebutuhan.
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <div>
              <h2 style={styles.formTitle}>
                {editId !== null
                  ? "Edit Data Kontraktor"
                  : "Tambah PT / CV"}
              </h2>

              <p style={styles.formSubtitle}>
                RHODAS CAB. ACEH TIMUR
              </p>
            </div>

            <button
              onClick={tutupForm}
              style={styles.closeButton}
            >
              ✕
            </button>
          </div>

          <form onSubmit={simpanData}>
            <section>
              <h3 style={styles.sectionTitle}>
                1. Identitas Perusahaan
              </h3>

              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Jenis Perusahaan *
                  </label>

                  <select
                    name="jenis_perusahaan"
                    value={form.jenis_perusahaan}
                    onChange={ubahForm}
                    style={styles.input}
                  >
                    <option value="PT">PT</option>
                    <option value="CV">CV</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Nama Perusahaan *
                  </label>

                  <input
                    name="nama_perusahaan"
                    value={form.nama_perusahaan}
                    onChange={ubahForm}
                    placeholder="Contoh: PT ABC"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    NIB
                  </label>

                  <input
                    name="nib"
                    value={form.nib}
                    onChange={ubahForm}
                    placeholder="Nomor Induk Berusaha"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    NPWP Perusahaan
                  </label>

                  <input
                    name="npwp"
                    value={form.npwp}
                    onChange={ubahForm}
                    placeholder="NPWP"
                    style={styles.input}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 style={styles.sectionTitle}>
                2. Data Direktur / Pimpinan
              </h3>

              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Nama Direktur / Pimpinan
                  </label>

                  <input
                    name="nama_direktur"
                    value={form.nama_direktur}
                    onChange={ubahForm}
                    placeholder="Nama lengkap"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    NIK Direktur / Pimpinan
                  </label>

                  <input
                    name="nik_direktur"
                    value={form.nik_direktur}
                    onChange={ubahForm}
                    placeholder="NIK"
                    inputMode="numeric"
                    style={styles.input}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 style={styles.sectionTitle}>
                3. Data Rekening Perusahaan
              </h3>

              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Nama Bank
                  </label>

                  <input
                    name="nama_bank"
                    value={form.nama_bank}
                    onChange={ubahForm}
                    placeholder="Contoh: Bank Aceh"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    No. Rekening Perusahaan
                  </label>

                  <input
                    name="no_rekening"
                    value={form.no_rekening}
                    onChange={ubahForm}
                    placeholder="Nomor rekening"
                    inputMode="numeric"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Atas Nama Rekening
                  </label>

                  <input
                    name="atas_nama_rekening"
                    value={form.atas_nama_rekening}
                    onChange={ubahForm}
                    placeholder="Nama pemilik rekening"
                    style={styles.input}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 style={styles.sectionTitle}>
                4. Kontak & Alamat
              </h3>

              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    No. Telepon
                  </label>

                  <input
                    name="no_telepon"
                    value={form.no_telepon}
                    onChange={ubahForm}
                    placeholder="08xxxxxxxxxx"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={ubahForm}
                    placeholder="email@perusahaan.com"
                    style={styles.input}
                  />
                </div>

                <div
                  style={{
                    ...styles.field,
                    gridColumn: "1 / -1",
                  }}
                >
                  <label style={styles.label}>
                    Alamat Perusahaan
                  </label>

                  <textarea
                    name="alamat"
                    value={form.alamat}
                    onChange={ubahForm}
                    placeholder="Alamat lengkap perusahaan"
                    style={{
                      ...styles.input,
                      minHeight: 80,
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 style={styles.sectionTitle}>
                5. Data Kontrak & Target
              </h3>

              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    No. Kontrak
                  </label>

                  <input
                    name="no_kontrak"
                    value={form.no_kontrak}
                    onChange={ubahForm}
                    placeholder="Nomor kontrak"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Tanggal Kontrak
                  </label>

                  <input
                    type="date"
                    name="tanggal_kontrak"
                    value={form.tanggal_kontrak}
                    onChange={ubahForm}
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Target Huntap
                  </label>

                  <input
                    type="number"
                    name="target_huntap"
                    value={form.target_huntap}
                    onChange={ubahForm}
                    min="0"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={ubahForm}
                    style={styles.input}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">
                      Tidak Aktif
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    ...styles.field,
                    gridColumn: "1 / -1",
                  }}
                >
                  <label style={styles.label}>
                    Keterangan
                  </label>

                  <textarea
                    name="keterangan"
                    value={form.keterangan}
                    onChange={ubahForm}
                    placeholder="Keterangan tambahan..."
                    style={{
                      ...styles.input,
                      minHeight: 80,
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </section>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={tutupForm}
                style={styles.secondaryButton}
                disabled={saving}
              >
                Batal
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : editId !== null
                  ? "Simpan Perubahan"
                  : "Simpan PT / CV"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Daftar Kontraktor
            </h2>

            <p style={styles.cardSubtitle}>
              Total: {data.length} perusahaan
            </p>
          </div>
        </div>

        {loading ? (
          <div style={styles.empty}>
            Memuat data kontraktor...
          </div>
        ) : data.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🏢</div>

            <h3 style={{ margin: "10px 0 5px" }}>
              Belum ada data kontraktor
            </h3>

            <p style={{ margin: 0, color: "#666" }}>
              Klik tombol <strong>+ Tambah PT / CV</strong>{" "}
              untuk menambahkan perusahaan kontraktor.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>No</th>
                  <th style={styles.th}>Perusahaan</th>
                  <th style={styles.th}>Direktur</th>
                  <th style={styles.th}>Bank / Rekening</th>
                  <th style={styles.th}>Target</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      {index + 1}
                    </td>

                    <td style={styles.td}>
                      <strong>
                        {item.jenis_perusahaan}{" "}
                        {item.nama_perusahaan}
                      </strong>

                      {item.no_kontrak && (
                        <div style={styles.smallText}>
                          Kontrak: {item.no_kontrak}
                        </div>
                      )}
                    </td>

                    <td style={styles.td}>
                      {item.nama_direktur || "-"}

                      {item.nik_direktur && (
                        <div style={styles.smallText}>
                          NIK: {item.nik_direktur}
                        </div>
                      )}
                    </td>

                    <td style={styles.td}>
                      {item.nama_bank || "-"}

                      {item.no_rekening && (
                        <div style={styles.smallText}>
                          {tampilkanRekening(
                            item.no_rekening
                          )}
                        </div>
                      )}
                    </td>

                    <td style={styles.td}>
                      <strong>
                        {item.target_huntap}
                      </strong>{" "}
                      unit
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(item.status === "Aktif"
                            ? styles.badgeAktif
                            : styles.badgeNonaktif),
                        }}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionGroup}>
                        <Link
                          href={`/kontraktor/${item.id}`}
                          style={styles.manageButton}
                        >
                          Kelola Huntap
                        </Link>

                        <button
                          onClick={() => bukaEdit(item)}
                          style={styles.editButton}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            hapusData(
                              item.id,
                              item.nama_perusahaan
                            )
                          }
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
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "30px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700,
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#666",
    fontSize: "15px",
  },

  primaryButton: {
    border: "none",
    borderRadius: "8px",
    padding: "12px 18px",
    background: "#1d4ed8",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
  },

  secondaryButton: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "12px 18px",
    background: "white",
    color: "#333",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
  },

  infoBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "20px",
    color: "#1e3a8a",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  formCard: {
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },

  formTitle: {
    margin: 0,
    fontSize: "22px",
  },

  formSubtitle: {
    margin: "5px 0 0",
    color: "#777",
    fontSize: "13px",
  },

  closeButton: {
    border: "none",
    background: "#f3f4f6",
    borderRadius: "7px",
    width: "34px",
    height: "34px",
    cursor: "pointer",
    fontSize: "16px",
  },

  sectionTitle: {
    fontSize: "16px",
    margin: "24px 0 14px",
    paddingBottom: "8px",
    borderBottom: "1px solid #eee",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#333",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #ccc",
    borderRadius: "7px",
    fontSize: "14px",
    background: "white",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "1px solid #eee",
  },

  card: {
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
  },

  cardHeader: {
    padding: "20px 22px",
    borderBottom: "1px solid #eee",
  },

  cardTitle: {
    margin: 0,
    fontSize: "20px",
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: "#777",
    fontSize: "13px",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1050px",
  },

  th: {
    textAlign: "left",
    padding: "13px 14px",
    background: "#f8fafc",
    borderBottom: "1px solid #ddd",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    verticalAlign: "top",
  },

  smallText: {
    marginTop: "5px",
    color: "#777",
    fontSize: "12px",
  },

  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
  },

  badgeAktif: {
    background: "#dcfce7",
    color: "#166534",
  },

  badgeNonaktif: {
    background: "#f3f4f6",
    color: "#555",
  },

  actionGroup: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  manageButton: {
    display: "inline-block",
    textDecoration: "none",
    border: "none",
    borderRadius: "6px",
    padding: "7px 10px",
    background: "#dcfce7",
    color: "#166534",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  editButton: {
    border: "none",
    borderRadius: "6px",
    padding: "7px 10px",
    background: "#e0f2fe",
    color: "#075985",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  deleteButton: {
    border: "none",
    borderRadius: "6px",
    padding: "7px 10px",
    background: "#fee2e2",
    color: "#991b1b",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  empty: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#777",
  },

  emptyIcon: {
    fontSize: "40px",
  },
};