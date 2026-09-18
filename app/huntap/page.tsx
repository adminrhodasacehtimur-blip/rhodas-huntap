"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Huntap = {
  id: number;
  kode_huntap: string;
  nama_penerima: string;
  nik: string | null;
  desa: string | null;
  kecamatan: string | null;
  status: string;
  progress: number;
};

type FormData = {
  kode_huntap: string;
  nama_penerima: string;
  nik: string;
  desa: string;
  kecamatan: string;
  status: string;
  progress: string;
};

const formAwal: FormData = {
  kode_huntap: "",
  nama_penerima: "",
  nik: "",
  desa: "",
  kecamatan: "",
  status: "Belum Mulai",
  progress: "0",
};

export default function HuntapPage() {
  const supabase = createClient();

  const [dataHuntap, setDataHuntap] = useState<Huntap[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(formAwal);
  const [kataKunci, setKataKunci] = useState("");

  async function ambilData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("huntap")
      .select(
        "id, kode_huntap, nama_penerima, nik, desa, kecamatan, status, progress"
      )
      .order("id", { ascending: true });

    if (error) {
      alert("Gagal mengambil data: " + error.message);
      setLoading(false);
      return;
    }

    setDataHuntap(data || []);
    setLoading(false);
  }

  useEffect(() => {
    ambilData();
  }, []);

  function bukaTambah() {
    setEditId(null);
    setForm(formAwal);
    setShowForm(true);
  }

  function bukaEdit(item: Huntap) {
    setEditId(item.id);

    setForm({
      kode_huntap: item.kode_huntap,
      nama_penerima: item.nama_penerima,
      nik: item.nik || "",
      desa: item.desa || "",
      kecamatan: item.kecamatan || "",
      status: item.status,
      progress: String(item.progress),
    });

    setShowForm(true);
  }

  function tutupForm() {
    setShowForm(false);
    setEditId(null);
    setForm(formAwal);
  }

  async function simpanData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.kode_huntap.trim()) {
      alert("Kode Huntap wajib diisi.");
      return;
    }

    if (!form.nama_penerima.trim()) {
      alert("Nama penerima wajib diisi.");
      return;
    }

    if (form.nik.trim() && !/^\d{16}$/.test(form.nik.trim())) {
      alert("NIK harus terdiri dari 16 digit.");
      return;
    }

    const progress = Number(form.progress);

    if (progress < 0 || progress > 100) {
      alert("Progress harus antara 0 sampai 100.");
      return;
    }

    setSaving(true);

    const data = {
      kode_huntap: form.kode_huntap.trim(),
      nama_penerima: form.nama_penerima.trim(),
      nik: form.nik.trim() || null,
      desa: form.desa.trim() || null,
      kecamatan: form.kecamatan.trim() || null,
      status: form.status,
      progress,
    };

    if (editId === null) {
      const { error } = await supabase.from("huntap").insert(data);

      if (error) {
        alert("Gagal menambah data: " + error.message);
        setSaving(false);
        return;
      }

      alert("Data Huntap berhasil ditambahkan.");
    } else {
      const { error } = await supabase
        .from("huntap")
        .update(data)
        .eq("id", editId);

      if (error) {
        alert("Gagal mengubah data: " + error.message);
        setSaving(false);
        return;
      }

      alert("Data Huntap berhasil diubah.");
    }

    setSaving(false);
    tutupForm();
    await ambilData();
  }

  async function hapusData(id: number) {
    const yakin = confirm(
      "Apakah Anda yakin ingin menghapus data Huntap ini?"
    );

    if (!yakin) return;

    const { error } = await supabase
      .from("huntap")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus data: " + error.message);
      return;
    }

    alert("Data Huntap berhasil dihapus.");
    await ambilData();
  }

  const dataTersaring = dataHuntap.filter((item) => {
    const kata = kataKunci.trim().toLowerCase();

    if (!kata) return true;

    return (
      item.kode_huntap.toLowerCase().includes(kata) ||
      item.nama_penerima.toLowerCase().includes(kata) ||
      (item.nik || "").includes(kata) ||
      (item.desa || "").toLowerCase().includes(kata) ||
      (item.kecamatan || "").toLowerCase().includes(kata)
    );
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            gap: "15px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
              }}
            >
              DATA HUNTAP
            </h1>

            <p
              style={{
                marginTop: "6px",
                color: "#666",
              }}
            >
              PT RHODAS — CABANG ACEH TIMUR
            </p>
          </div>

          <button
            onClick={bukaTambah}
            style={{
              background: "#111827",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 18px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            + Tambah Huntap
          </button>
        </div>

        {/* FORM TAMBAH / EDIT */}
        {showForm && (
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              marginBottom: "25px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              {editId === null
                ? "Tambah Data Huntap"
                : "Edit Data Huntap"}
            </h2>

            <form onSubmit={simpanData}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "15px",
                }}
              >
                <div>
                  <label>Kode Huntap</label>

                  <input
                    value={form.kode_huntap}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        kode_huntap: e.target.value,
                      })
                    }
                    placeholder="Contoh: HNT-AET-001"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label>Nama Penerima</label>

                  <input
                    value={form.nama_penerima}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nama_penerima: e.target.value,
                      })
                    }
                    placeholder="Nama lengkap"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label>NIK</label>

                  <input
                    value={form.nik}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nik: e.target.value,
                      })
                    }
                    placeholder="16 digit NIK"
                    maxLength={16}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label>Desa</label>

                  <input
                    value={form.desa}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        desa: e.target.value,
                      })
                    }
                    placeholder="Nama desa"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label>Kecamatan</label>

                  <input
                    value={form.kecamatan}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        kecamatan: e.target.value,
                      })
                    }
                    placeholder="Nama kecamatan"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label>Status</label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    style={inputStyle}
                  >
                    <option>Belum Mulai</option>
                    <option>Persiapan</option>
                    <option>Pondasi</option>
                    <option>Struktur</option>
                    <option>Atap</option>
                    <option>Finishing</option>
                    <option>Selesai</option>
                  </select>
                </div>

                <div>
                  <label>Progress (%)</label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        progress: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "11px 18px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {saving
                    ? "Menyimpan..."
                    : editId === null
                    ? "Simpan Data"
                    : "Simpan Perubahan"}
                </button>

                <button
                  type="button"
                  onClick={tutupForm}
                  style={{
                    background: "#e5e7eb",
                    color: "#111827",
                    border: "none",
                    borderRadius: "8px",
                    padding: "11px 18px",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DAFTAR HUNTAP */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              padding: "20px",
            }}
          >
            <h2
              style={{
                margin: 0,
              }}
            >
              Daftar Huntap
            </h2>

            {/* PENCARIAN */}
            <input
              type="text"
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              placeholder="🔍 Cari kode, nama, NIK, desa, atau kecamatan..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                marginTop: "15px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />

            <div
              style={{
                marginTop: "10px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Menampilkan {dataTersaring.length} dari{" "}
              {dataHuntap.length} data Huntap
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
              }}
            >
              Memuat data...
            </div>
          ) : dataTersaring.length === 0 ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              {dataHuntap.length === 0
                ? "Belum ada data Huntap."
                : "Data Huntap yang dicari tidak ditemukan."}
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f3f4f6",
                    }}
                  >
                    <th style={thStyle}>No</th>
                    <th style={thStyle}>Kode Huntap</th>
                    <th style={thStyle}>Nama Penerima</th>
                    <th style={thStyle}>NIK</th>
                    <th style={thStyle}>Desa</th>
                    <th style={thStyle}>Kecamatan</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Progress</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {dataTersaring.map((item, index) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>
                        {index + 1}
                      </td>

                      <td style={tdStyle}>
                        {item.kode_huntap}
                      </td>

                      <td style={tdStyle}>
                        {item.nama_penerima}
                      </td>

                      <td style={tdStyle}>
                        {item.nik || "-"}
                      </td>

                      <td style={tdStyle}>
                        {item.desa || "-"}
                      </td>

                      <td style={tdStyle}>
                        {item.kecamatan || "-"}
                      </td>

                      <td style={tdStyle}>
                        {item.status}
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            minWidth: "130px",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: "8px",
                              background: "#e5e7eb",
                              borderRadius: "10px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${item.progress}%`,
                                height: "100%",
                                background: "#2563eb",
                              }}
                            />
                          </div>

                          <span>
                            {item.progress}%
                          </span>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={() => bukaEdit(item)}
                            style={{
                              background: "#f59e0b",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              padding: "7px 12px",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => hapusData(item.id)}
                            style={{
                              background: "#dc2626",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              padding: "7px 12px",
                              cursor: "pointer",
                            }}
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
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  marginTop: "6px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  fontSize: "14px",
};

const thStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "left",
  fontSize: "13px",
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "14px",
};