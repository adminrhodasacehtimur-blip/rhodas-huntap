"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/utils/supabase/client";

type Huntap = {
  id: number;
  kode_huntap: string;
  nama_penerima: string;
  nik: string | null;
  no_kk: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  alamat: string | null;
  status: string;
  progress: number;
};

export default function LaporanPage() {
  const supabase = createClient();

  const [huntap, setHuntap] = useState<Huntap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHuntapId, setSelectedHuntapId] = useState("");

  async function loadLaporan() {
    setLoading(true);

    const { data, error } = await supabase
      .from("huntap")
      .select(`
        id,
        kode_huntap,
        nama_penerima,
        nik,
        no_kk,
        desa,
        kecamatan,
        kabupaten,
        alamat,
        status,
        progress
      `)
      .order("kode_huntap", { ascending: true });

    if (error) {
      alert("Gagal mengambil data laporan: " + error.message);
      setLoading(false);
      return;
    }

    setHuntap((data || []) as Huntap[]);
    setLoading(false);
  }

  useEffect(() => {
    loadLaporan();
  }, []);

  // =========================
  // RINGKASAN
  // =========================

  const total = huntap.length;

  const belumMulai = huntap.filter(
    (item) => item.status === "Belum Mulai"
  ).length;

  const pembangunan = huntap.filter(
    (item) =>
      item.status !== "Belum Mulai" &&
      item.status !== "Selesai"
  ).length;

  const selesai = huntap.filter(
    (item) => item.status === "Selesai"
  ).length;

  const rataRata =
    total > 0
      ? Math.round(
          huntap.reduce(
            (jumlah, item) =>
              jumlah + Number(item.progress || 0),
            0
          ) / total
        )
      : 0;

  // =========================
  // CETAK
  // =========================

  function cetakLaporan() {
    window.print();
  }

  // =========================
  // EXCEL KESELURUHAN
  // =========================

  function exportExcelKeseluruhan() {
    if (huntap.length === 0) {
      alert("Tidak ada data Huntap untuk diexport.");
      return;
    }

    const dataExcel = huntap.map((item, index) => ({
      No: index + 1,
      "Kode Huntap": item.kode_huntap,
      "Nama Penerima": item.nama_penerima,
      NIK: item.nik || "",
      "No. KK": item.no_kk || "",
      Desa: item.desa || "",
      Kecamatan: item.kecamatan || "",
      Kabupaten: item.kabupaten || "",
      Alamat: item.alamat || "",
      Status: item.status,
      "Progress (%)": Number(item.progress || 0),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Data Huntap"
    );

    // Lebar kolom
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
      { wch: 40 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.writeFile(
      workbook,
      "Laporan_Huntap_Aceh_Timur.xlsx"
    );
  }

  // =========================
  // EXCEL PER HUNTAP
  // =========================

  function exportExcelPerHuntap() {
    if (!selectedHuntapId) {
      alert("Silakan pilih Huntap terlebih dahulu.");
      return;
    }

    const item = huntap.find(
      (data) =>
        String(data.id) === String(selectedHuntapId)
    );

    if (!item) {
      alert("Data Huntap tidak ditemukan.");
      return;
    }

    const dataExcel = [
      {
        "Kode Huntap": item.kode_huntap,
        "Nama Penerima": item.nama_penerima,
        NIK: item.nik || "",
        "No. KK": item.no_kk || "",
        Desa: item.desa || "",
        Kecamatan: item.kecamatan || "",
        Kabupaten: item.kabupaten || "",
        Alamat: item.alamat || "",
        Status: item.status,
        "Progress (%)": Number(item.progress || 0),
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Data Huntap"
    );

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
      { wch: 40 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.writeFile(
      workbook,
      `Laporan_${item.kode_huntap}.xlsx`
    );
  }

  return (
    <main
      style={{
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        background: "#f5f6f8",
        minHeight: "100vh",
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
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>
              Laporan Huntap
            </h1>

            <p style={{ color: "#666" }}>
              Laporan administrasi Hunian Tetap
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={exportExcelKeseluruhan}
              style={buttonStyle}
            >
              📊 Excel Keseluruhan
            </button>

            <button
              onClick={cetakLaporan}
              style={buttonStyle}
            >
              🖨️ Cetak
            </button>

            <a
              href="/"
              style={{
                ...buttonStyle,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              ← Dashboard
            </a>
          </div>
        </div>

        {/* JUDUL LAPORAN */}
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            LAPORAN DATA HUNIAN TETAP
          </h2>

          <p
            style={{
              textAlign: "center",
              margin: 0,
              color: "#555",
            }}
          >
            PT RHODAS — Cabang Aceh Timur
          </p>
        </div>

        {/* RINGKASAN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <SummaryCard
            title="Total Huntap"
            value={total}
          />

          <SummaryCard
            title="Belum Mulai"
            value={belumMulai}
          />

          <SummaryCard
            title="Sedang Pembangunan"
            value={pembangunan}
          />

          <SummaryCard
            title="Selesai"
            value={selesai}
          />

          <SummaryCard
            title="Rata-rata Progress"
            value={`${rataRata}%`}
          />
        </div>

        {/* EXPORT PER HUNTAP */}
        <div
          className="no-print"
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "25px",
            marginBottom: "25px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Download Laporan Per Huntap
          </h2>

          <p style={{ color: "#666" }}>
            Pilih satu Huntap untuk mengunduh laporan
            dalam format Excel.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <select
              value={selectedHuntapId}
              onChange={(e) =>
                setSelectedHuntapId(e.target.value)
              }
              style={{
                flex: 1,
                minWidth: "300px",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                fontSize: "15px",
                background: "white",
              }}
            >
              <option value="">
                -- Pilih Huntap --
              </option>

              {huntap.map((item) => (
                <option
                  key={item.id}
                  value={String(item.id)}
                >
                  {item.kode_huntap} -{" "}
                  {item.nama_penerima}
                </option>
              ))}
            </select>

            <button
              onClick={exportExcelPerHuntap}
              style={buttonStyle}
            >
              📥 Download Excel Huntap
            </button>
          </div>
        </div>

        {/* TABEL */}
        <div
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "25px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Daftar Data Huntap
          </h2>

          {loading ? (
            <p>Memuat data laporan...</p>
          ) : huntap.length === 0 ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                color: "#666",
                background: "#f8f8f8",
                borderRadius: "8px",
              }}
            >
              Belum ada data Huntap.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>No</th>
                    <th style={thStyle}>
                      Kode Huntap
                    </th>
                    <th style={thStyle}>
                      Nama Penerima
                    </th>
                    <th style={thStyle}>NIK</th>
                    <th style={thStyle}>No. KK</th>
                    <th style={thStyle}>Desa</th>
                    <th style={thStyle}>
                      Kecamatan
                    </th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>
                      Progress
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {huntap.map((item, index) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>
                        {index + 1}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {item.kode_huntap}
                        </strong>
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
                        {item.status}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {Number(
                            item.progress || 0
                          )}
                          %
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: "30px",
            textAlign: "right",
            color: "#666",
            fontSize: "13px",
          }}
        >
          Dicetak dari Sistem Administrasi Hunian Tetap
          RHODAS
        </div>
      </div>

      {/* PRINT STYLE */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
            background: white !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          @page {
            size: landscape;
            margin: 15mm;
          }
        }
      `}</style>
    </main>
  );
}

// =========================
// SUMMARY CARD
// =========================

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #ddd",
      }}
    >
      <div style={{ color: "#666" }}>
        {title}
      </div>

      <div
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          marginTop: "8px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// =========================
// BUTTON STYLE
// =========================

const buttonStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
};

// =========================
// TABLE HEADER STYLE
// =========================

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "2px solid #333",
  background: "#f5f5f5",
  whiteSpace: "nowrap",
};

// =========================
// TABLE DATA STYLE
// =========================

const tdStyle: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
  whiteSpace: "nowrap",
};