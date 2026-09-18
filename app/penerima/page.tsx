"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Penerima = {
  id: number;
  kode_huntap: string;
  nama_penerima: string;
  nik: string | null;
  no_kk: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  alamat: string | null;
};

export default function DataPenerima() {
  const supabase = createClient();

  const [data, setData] = useState<Penerima[]>([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState("");

  async function ambilData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("huntap")
      .select(
        "id, kode_huntap, nama_penerima, nik, no_kk, desa, kecamatan, kabupaten, alamat"
      )
      .order("id", { ascending: false });

    if (error) {
      console.error("Gagal mengambil data penerima:", error);
    } else {
      setData(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    ambilData();
  }, []);

  const dataTersaring = data.filter((item) => {
    const kata = kataKunci.toLowerCase();

    return (
      item.kode_huntap.toLowerCase().includes(kata) ||
      item.nama_penerima.toLowerCase().includes(kata) ||
      (item.nik || "").toLowerCase().includes(kata) ||
      (item.no_kk || "").toLowerCase().includes(kata) ||
      (item.desa || "").toLowerCase().includes(kata) ||
      (item.kecamatan || "").toLowerCase().includes(kata)
    );
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* NAVIGASI */}
      <div
        style={{
          background: "#1e293b",
          color: "white",
          padding: "18px 30px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
              }}
            >
              RHODAS HUNTAP
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#cbd5e1",
                marginTop: "3px",
              }}
            >
              Administrasi Hunian Tetap
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              style={{
                background: "#334155",
                color: "white",
                padding: "9px 14px",
                borderRadius: "7px",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Dashboard
            </Link>

            <Link
              href="/huntap"
              style={{
                background: "#334155",
                color: "white",
                padding: "9px 14px",
                borderRadius: "7px",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Data Huntap
            </Link>

            <Link
              href="/penerima"
              style={{
                background: "#2563eb",
                color: "white",
                padding: "9px 14px",
                borderRadius: "7px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Data Penerima
            </Link>

            <Link
              href="/dokumen"
              style={{
                background: "#334155",
                color: "white",
                padding: "9px 14px",
                borderRadius: "7px",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Dokumen
            </Link>

            <Link
              href="/dokumentasi"
              style={{
                background: "#334155",
                color: "white",
                padding: "9px 14px",
                borderRadius: "7px",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Dokumentasi
            </Link>
          </nav>
        </div>
      </div>

      {/* KONTEN */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "30px",
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: "25px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              color: "#0f172a",
            }}
          >
            Data Penerima
          </h1>

          <p style={{ color: "#64748b" }}>
            Daftar penerima Huntap — PT RHODAS Cabang Aceh Timur
          </p>
        </div>

        {/* PENCARIAN */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            marginBottom: "20px",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Cari Penerima
          </label>

          <input
            type="text"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            placeholder="Cari nama, NIK, No. KK, kode Huntap, desa, atau kecamatan..."
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
              marginBottom: 0,
            }}
          >
            Menampilkan {dataTersaring.length} dari {data.length} penerima
          </p>
        </div>

        {/* TABEL */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
              }}
            >
              Daftar Penerima
            </h2>

            <button
              onClick={ambilData}
              style={{
                padding: "9px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "7px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Memuat data...</p>
          ) : dataTersaring.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              Belum ada data penerima yang sesuai.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1000px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                    }}
                  >
                    <th style={thStyle}>Kode Huntap</th>
                    <th style={thStyle}>Nama Penerima</th>
                    <th style={thStyle}>NIK</th>
                    <th style={thStyle}>No. KK</th>
                    <th style={thStyle}>Desa</th>
                    <th style={thStyle}>Kecamatan</th>
                    <th style={thStyle}>Kabupaten</th>
                    <th style={thStyle}>Alamat</th>
                  </tr>
                </thead>

                <tbody>
                  {dataTersaring.map((item) => (
                    <tr key={item.id}>
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
                        {item.no_kk || "-"}
                      </td>

                      <td style={tdStyle}>
                        {item.desa || "-"}
                      </td>

                      <td style={tdStyle}>
                        {item.kecamatan || "-"}
                      </td>

                      <td style={tdStyle}>
                        {item.kabupaten || "-"}
                      </td>

                      <td style={tdStyle}>
                        {item.alamat || "-"}
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

const thStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "2px solid #e5e7eb",
  fontSize: "14px",
  color: "#334155",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "14px",
  color: "#334155",
};