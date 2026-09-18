"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Kontraktor = {
  id: number;
  jenis_perusahaan: string | null;
  nama_perusahaan: string | null;
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
  target_huntap: number | null;
  status: string | null;
  keterangan: string | null;
};

type Huntap = {
  id: string;
  kode_huntap: string | null;
  nomor_unit: string | null;
  nama_penerima: string | null;
  nik: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  alamat: string | null;
  status: string | null;
  progress: number | null;
  kontraktor_id: number | null;
};

const supabase = createClient();

export default function KontraktorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [kontraktorId, setKontraktorId] = useState("");

  const [kontraktor, setKontraktor] = useState<Kontraktor | null>(null);
  const [huntapList, setHuntapList] = useState<Huntap[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingHuntap, setLoadingHuntap] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedHuntapId, setSelectedHuntapId] = useState("");
  const [search, setSearch] = useState("");

  const [detailItem, setDetailItem] = useState<Huntap | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // AMBIL ID KONTRAKTOR
  // ============================================================
  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setKontraktorId(resolvedParams.id);
    }

    getParams();
  }, [params]);

  // ============================================================
  // LOAD DATA KONTRAKTOR
  // ============================================================
  useEffect(() => {
    if (!kontraktorId) return;

    loadKontraktor();
    loadHuntap();
  }, [kontraktorId]);

  async function loadKontraktor() {
    setLoading(true);
    setError("");

    const id = Number(kontraktorId);

    if (Number.isNaN(id)) {
      setError("ID kontraktor tidak valid.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("kontraktor")
      .select(
        `
        id,
        jenis_perusahaan,
        nama_perusahaan,
        nama_direktur,
        nik_direktur,
        nib,
        npwp,
        alamat,
        no_telepon,
        email,
        nama_bank,
        no_rekening,
        atas_nama_rekening,
        no_kontrak,
        tanggal_kontrak,
        target_huntap,
        status,
        keterangan
        `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      setError("Gagal mengambil data kontraktor: " + error.message);
      setKontraktor(null);
    } else {
      setKontraktor(data as Kontraktor);
    }

    setLoading(false);
  }

  // ============================================================
  // LOAD HUNTAP
  // ============================================================
  async function loadHuntap() {
    setLoadingHuntap(true);
    setError("");

    const id = Number(kontraktorId);

    if (Number.isNaN(id)) {
      setError("ID kontraktor tidak valid.");
      setLoadingHuntap(false);
      return;
    }

    const { data, error } = await supabase
      .from("huntap")
      .select(
        `
        id,
        kode_huntap,
        nomor_unit,
        nama_penerima,
        nik,
        desa,
        kecamatan,
        kabupaten,
        alamat,
        status,
        progress,
        kontraktor_id
        `
      )
      .eq("kontraktor_id", id)
      .order("kode_huntap", { ascending: true });

    if (error) {
      console.error(error);
      setError("Gagal mengambil data Huntap: " + error.message);
      setHuntapList([]);
    } else {
      setHuntapList((data || []) as Huntap[]);
    }

    setLoadingHuntap(false);
  }

  // ============================================================
  // HUNTAP YANG BELUM DITETAPKAN
  // ============================================================
  const unassignedHuntap = useMemo(() => {
    return huntapList;
  }, [huntapList]);

  // ============================================================
  // TOTAL & RATA-RATA PROGRESS
  // ============================================================
  const totalHuntap = huntapList.length;

  const totalSelesai = huntapList.filter(
    (item) => Number(item.progress || 0) >= 100
  ).length;

  const totalBelumMulai = huntapList.filter(
    (item) => Number(item.progress || 0) <= 0
  ).length;

  const totalSedang = huntapList.filter((item) => {
    const progress = Number(item.progress || 0);
    return progress > 0 && progress < 100;
  }).length;

  const rataProgress =
    totalHuntap > 0
      ? Math.round(
          huntapList.reduce(
            (total, item) => total + Number(item.progress || 0),
            0
          ) / totalHuntap
        )
      : 0;

  const targetHuntap = Number(kontraktor?.target_huntap || 0);

  const persentaseTarget =
    targetHuntap > 0
      ? Math.min(100, Math.round((totalHuntap / targetHuntap) * 100))
      : 0;

  // ============================================================
  // SEARCH
  // ============================================================
  const filteredHuntap = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return huntapList;
    }

    return huntapList.filter((item) => {
      return (
        String(item.kode_huntap || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.nomor_unit || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.nama_penerima || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.desa || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.kecamatan || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [huntapList, search]);

  // ============================================================
  // LEPASKAN HUNTAP
  // ============================================================
  async function handleLepaskan(item: Huntap) {
    const yakin = window.confirm(
      `Lepaskan Huntap ${item.kode_huntap || item.id} dari kontraktor ini?`
    );

    if (!yakin) return;

    setError("");
    setMessage("");
    setSaving(true);

    const { error } = await supabase
      .from("huntap")
      .update({
        kontraktor_id: null,
      })
      .eq("id", item.id);

    if (error) {
      console.error(error);
      setError("Gagal melepaskan Huntap: " + error.message);
      setSaving(false);
      return;
    }

    setMessage("Huntap berhasil dilepaskan dari kontraktor.");

    await loadHuntap();

    setSaving(false);
  }

  // ============================================================
  // TETAPKAN HUNTAP
  // ============================================================
  async function handleTetapkan() {
    if (!selectedHuntapId) {
      setError("Silakan pilih Huntap terlebih dahulu.");
      return;
    }

    if (!kontraktorId) {
      setError("ID kontraktor tidak ditemukan.");
      return;
    }

    setError("");
    setMessage("");
    setSaving(true);

    const idKontraktor = Number(kontraktorId);

    if (Number.isNaN(idKontraktor)) {
      setError("ID kontraktor tidak valid.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("huntap")
      .update({
        kontraktor_id: idKontraktor,
      })
      .eq("id", selectedHuntapId);

    if (error) {
      console.error(error);
      setError("Gagal menetapkan Huntap: " + error.message);
      setSaving(false);
      return;
    }

    setMessage("Huntap berhasil ditetapkan ke kontraktor.");

    setSelectedHuntapId("");

    await loadHuntap();

    setSaving(false);
  }

  // ============================================================
  // FORMAT TANGGAL
  // ============================================================
  function formatTanggal(value: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // ============================================================
  // STATUS
  // ============================================================
  function getStatus(item: Huntap) {
    const progress = Number(item.progress || 0);

    if (progress <= 0) {
      return "Belum Mulai";
    }

    if (progress >= 100) {
      return "Selesai";
    }

    return "Sedang Pembangunan";
  }

  function getStatusStyle(item: Huntap) {
    const status = getStatus(item);

    if (status === "Selesai") {
      return styles.statusDone;
    }

    if (status === "Belum Mulai") {
      return styles.statusNotStarted;
    }

    return styles.statusProgress;
  }

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingBox}>Memuat data kontraktor...</div>
      </main>
    );
  }

  // ============================================================
  // JIKA KONTRAKTOR TIDAK DITEMUKAN
  // ============================================================
  if (!kontraktor) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          {error && <div style={styles.error}>{error}</div>}

          <Link href="/kontraktor" style={styles.backButton}>
            ← Kembali ke Data Kontraktor
          </Link>
        </div>
      </main>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* ======================================================
            HEADER
        ====================================================== */}
        <div style={styles.header}>
          <div>
            <Link href="/kontraktor" style={styles.backLink}>
              ← Data Kontraktor
            </Link>

            <h1 style={styles.title}>
              {kontraktor.nama_perusahaan || "-"}
            </h1>

            <p style={styles.subtitle}>
              {kontraktor.jenis_perusahaan || "Kontraktor"} • Kelola Huntap
            </p>
          </div>
        </div>

        {/* ======================================================
            PESAN
        ====================================================== */}
        {message && <div style={styles.success}>{message}</div>}

        {error && <div style={styles.error}>{error}</div>}

        {/* ======================================================
            INFORMASI KONTRAKTOR
        ====================================================== */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Informasi Kontraktor</h2>

          <div style={styles.infoGrid}>
            <Info label="Jenis Perusahaan" value={kontraktor.jenis_perusahaan} />
            <Info label="Nama Perusahaan" value={kontraktor.nama_perusahaan} />
            <Info label="Nama Direktur" value={kontraktor.nama_direktur} />
            <Info label="NIK Direktur" value={kontraktor.nik_direktur} />
            <Info label="NIB" value={kontraktor.nib} />
            <Info label="NPWP" value={kontraktor.npwp} />
            <Info label="No. Telepon" value={kontraktor.no_telepon} />
            <Info label="Email" value={kontraktor.email} />
            <Info label="Nama Bank" value={kontraktor.nama_bank} />
            <Info label="No. Rekening" value={kontraktor.no_rekening} />
            <Info
              label="Atas Nama Rekening"
              value={kontraktor.atas_nama_rekening}
            />
            <Info label="No. Kontrak" value={kontraktor.no_kontrak} />
            <Info
              label="Tanggal Kontrak"
              value={formatTanggal(kontraktor.tanggal_kontrak)}
            />
            <Info
              label="Target Huntap"
              value={
                kontraktor.target_huntap !== null
                  ? `${kontraktor.target_huntap} Unit`
                  : "-"
              }
            />
            <Info label="Status" value={kontraktor.status} />

            <div style={styles.infoItem}>
              <strong>Alamat</strong>
              <span>{kontraktor.alamat || "-"}</span>
            </div>

            <div style={styles.infoItem}>
              <strong>Keterangan</strong>
              <span>{kontraktor.keterangan || "-"}</span>
            </div>
          </div>
        </section>

        {/* ======================================================
            RINGKASAN
        ====================================================== */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Ringkasan Huntap</h2>

          <div style={styles.statsGrid}>
            <StatCard
              label="Total Huntap"
              value={totalHuntap}
              description={
                targetHuntap > 0
                  ? `Target ${targetHuntap} unit`
                  : "Belum ada target"
              }
            />

            <StatCard
              label="Belum Mulai"
              value={totalBelumMulai}
              description="Progress 0%"
            />

            <StatCard
              label="Sedang Pembangunan"
              value={totalSedang}
              description="Progress 1–99%"
            />

            <StatCard
              label="Selesai"
              value={totalSelesai}
              description="Progress 100%"
            />

            <StatCard
              label="Rata-rata Progress"
              value={`${rataProgress}%`}
              description="Seluruh Huntap"
            />
          </div>

          {/* TARGET */}
          {targetHuntap > 0 && (
            <div style={styles.targetBox}>
              <div style={styles.targetHeader}>
                <strong>Pencapaian Target Huntap</strong>

                <span>
                  {totalHuntap} / {targetHuntap} Unit
                </span>
              </div>

              <div style={styles.targetTrack}>
                <div
                  style={{
                    ...styles.targetFill,
                    width: `${persentaseTarget}%`,
                  }}
                />
              </div>

              <div style={styles.targetPercent}>
                {persentaseTarget}% dari target
              </div>
            </div>
          )}
        </section>

        {/* ======================================================
            TETAPKAN HUNTAP
        ====================================================== */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Tetapkan Huntap</h2>

          <p style={styles.sectionDescription}>
            Pilih Huntap yang belum memiliki kontraktor untuk ditetapkan ke
            perusahaan ini.
          </p>

          <div style={styles.assignRow}>
            <select
              value={selectedHuntapId}
              onChange={(e) => setSelectedHuntapId(e.target.value)}
              style={styles.input}
              disabled={saving}
            >
              <option value="">-- Pilih Huntap --</option>

              {unassignedHuntap.length === 0 ? (
                <option value="" disabled>
                  Tidak ada Huntap tersedia
                </option>
              ) : (
                unassignedHuntap.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.kode_huntap || "-"} — Unit{" "}
                    {item.nomor_unit || "-"} —{" "}
                    {item.nama_penerima || "-"}
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              onClick={handleTetapkan}
              disabled={saving || !selectedHuntapId}
              style={{
                ...styles.assignButton,
                opacity: saving || !selectedHuntapId ? 0.5 : 1,
                cursor:
                  saving || !selectedHuntapId
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {saving ? "Menyimpan..." : "Tetapkan"}
            </button>
          </div>
        </section>

        {/* ======================================================
            MONITORING PROGRESS
        ====================================================== */}
        <section style={styles.card}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h2 style={styles.sectionTitle}>
                Monitoring Progress Pembangunan
              </h2>

              <p style={styles.sectionDescription}>
                Pantau perkembangan pembangunan setiap Huntap milik kontraktor
                ini.
              </p>
            </div>

            <div style={styles.averageBox}>
              <span>Rata-rata</span>
              <strong>{rataProgress}%</strong>
            </div>
          </div>

          <div style={styles.progressSummary}>
            <SummaryMini
              label="Belum Mulai"
              value={totalBelumMulai}
            />

            <SummaryMini
              label="1–25%"
              value={
                huntapList.filter((item) => {
                  const p = Number(item.progress || 0);
                  return p >= 1 && p <= 25;
                }).length
              }
            />

            <SummaryMini
              label="26–50%"
              value={
                huntapList.filter((item) => {
                  const p = Number(item.progress || 0);
                  return p >= 26 && p <= 50;
                }).length
              }
            />

            <SummaryMini
              label="51–75%"
              value={
                huntapList.filter((item) => {
                  const p = Number(item.progress || 0);
                  return p >= 51 && p <= 75;
                }).length
              }
            />

            <SummaryMini
              label="76–99%"
              value={
                huntapList.filter((item) => {
                  const p = Number(item.progress || 0);
                  return p >= 76 && p <= 99;
                }).length
              }
            />

            <SummaryMini
              label="Selesai 100%"
              value={totalSelesai}
            />
          </div>
        </section>

        {/* ======================================================
            DAFTAR HUNTAP
        ====================================================== */}
        <section style={styles.card}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h2 style={styles.sectionTitle}>
                Huntap yang Dikelola
              </h2>

              <p style={styles.sectionDescription}>
                Daftar Huntap yang saat ini ditetapkan kepada kontraktor.
              </p>
            </div>

            <div style={styles.totalBadge}>
              {huntapList.length} Huntap
            </div>
          </div>

          {/* SEARCH */}
          <div style={styles.searchBox}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, unit, penerima, desa, kecamatan..."
              style={styles.searchInput}
            />
          </div>

          {loadingHuntap ? (
            <div style={styles.emptyBox}>Memuat data Huntap...</div>
          ) : filteredHuntap.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={{ fontSize: 40 }}>🏠</div>

              <strong>
                {huntapList.length === 0
                  ? "Belum ada Huntap"
                  : "Data tidak ditemukan"}
              </strong>

              <p>
                {huntapList.length === 0
                  ? "Belum ada Huntap yang ditetapkan kepada kontraktor ini."
                  : "Coba gunakan kata pencarian yang berbeda."}
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>No</th>
                    <th style={styles.th}>Kode Huntap</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.th}>Penerima</th>
                    <th style={styles.th}>Desa</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Progress</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHuntap.map((item, index) => {
                    const progress = Math.max(
                      0,
                      Math.min(100, Number(item.progress || 0))
                    );

                    return (
                      <tr key={item.id}>
                        <td style={styles.td}>{index + 1}</td>

                        <td style={styles.td}>
                          <strong>{item.kode_huntap || "-"}</strong>
                        </td>

                        <td style={styles.td}>
                          {item.nomor_unit || "-"}
                        </td>

                        <td style={styles.td}>
                          {item.nama_penerima || "-"}
                        </td>

                        <td style={styles.td}>
                          {item.desa || "-"}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...getStatusStyle(item),
                            }}
                          >
                            {getStatus(item)}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.progressCell}>
                            <div style={styles.progressTrack}>
                              <div
                                style={{
                                  ...styles.progressFill,
                                  width: `${progress}%`,
                                }}
                              />
                            </div>

                            <strong>{progress}%</strong>
                          </div>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.actionGroup}>
                            {/* DETAIL */}
                            <button
                              type="button"
                              onClick={() => setDetailItem(item)}
                              style={styles.detailButton}
                            >
                              Detail
                            </button>

                            {/* UPDATE PROGRESS */}
                            <Link
                              href={`/progress?huntap_id=${item.id}`}
                              style={styles.progressButton}
                            >
                              Update Progress
                            </Link>

                            {/* DOKUMEN */}
                            <Link
                              href={`/dokumen?huntap_id=${item.id}`}
                              style={styles.documentButton}
                            >
                              📄 Dokumen
                            </Link>

                            {/* DOKUMENTASI FOTO */}
                            <Link
                              href={`/dokumentasi?huntap_id=${item.id}`}
                              style={styles.photoButton}
                            >
                              📷 Foto
                            </Link>

                            {/* LEPASKAN */}
                            <button
                              type="button"
                              onClick={() => handleLepaskan(item)}
                              disabled={saving}
                              style={styles.releaseButton}
                            >
                              Lepaskan
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ======================================================
            DETAIL MODAL
        ====================================================== */}
        {detailItem && (
          <div
            style={styles.modalOverlay}
            onClick={() => setDetailItem(null)}
          >
            <div
              style={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={styles.modalTitle}>
                    Detail Huntap
                  </h2>

                  <p style={styles.subtitle}>
                    {detailItem.kode_huntap || "-"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  style={styles.closeButton}
                >
                  ×
                </button>
              </div>

              <div style={styles.modalGrid}>
                <Info
                  label="Kode Huntap"
                  value={detailItem.kode_huntap}
                />

                <Info
                  label="Nomor Unit"
                  value={detailItem.nomor_unit}
                />

                <Info
                  label="Nama Penerima"
                  value={detailItem.nama_penerima}
                />

                <Info label="NIK" value={detailItem.nik} />

                <Info label="Desa" value={detailItem.desa} />

                <Info
                  label="Kecamatan"
                  value={detailItem.kecamatan}
                />

                <Info
                  label="Kabupaten"
                  value={detailItem.kabupaten}
                />

                <Info
                  label="Status"
                  value={getStatus(detailItem)}
                />

                <Info
                  label="Progress"
                  value={`${Number(detailItem.progress || 0)}%`}
                />

                <div style={styles.infoItem}>
                  <strong>Alamat</strong>
                  <span>{detailItem.alamat || "-"}</span>
                </div>
              </div>

              <div style={styles.modalActions}>
                <Link
                  href={`/progress?huntap_id=${detailItem.id}`}
                  style={styles.progressButton}
                >
                  Update Progress
                </Link>

                <Link
                  href={`/dokumen?huntap_id=${detailItem.id}`}
                  style={styles.documentButton}
                >
                  📄 Dokumen
                </Link>

                <Link
                  href={`/dokumentasi?huntap_id=${detailItem.id}`}
                  style={styles.photoButton}
                >
                  📷 Dokumentasi Foto
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ================================================================
// KOMPONEN INFO
// ================================================================

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div style={styles.infoItem}>
      <strong>{label}</strong>
      <span>{value !== null && value !== undefined && value !== "" ? value : "-"}</span>
    </div>
  );
}

// ================================================================
// KOMPONEN STAT
// ================================================================

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statDescription}>{description}</div>
    </div>
  );
}

// ================================================================
// KOMPONEN MINI SUMMARY
// ================================================================

function SummaryMini({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={styles.summaryMini}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#1f2937",
  },

  container: {
    maxWidth: 1450,
    margin: "0 auto",
  },

  header: {
    marginBottom: 22,
  },

  backLink: {
    display: "inline-block",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 700,
    marginBottom: 10,
    fontSize: 14,
  },

  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 14,
  },

  backButton: {
    display: "inline-block",
    background: "#374151",
    color: "#fff",
    textDecoration: "none",
    padding: "11px 17px",
    borderRadius: 8,
    fontWeight: 700,
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 24,
    marginBottom: 22,
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },

  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
  },

  sectionDescription: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 13,
  },

  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 20,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 15,
    marginTop: 20,
  },

  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    padding: 13,
    background: "#f8fafc",
    borderRadius: 9,
    border: "1px solid #e5e7eb",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 14,
  },

  statCard: {
    padding: 17,
    borderRadius: 11,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },

  statLabel: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 700,
  },

  statValue: {
    fontSize: 28,
    fontWeight: 800,
    marginTop: 6,
  },

  statDescription: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 3,
  },

  targetBox: {
    marginTop: 20,
    padding: 17,
    borderRadius: 10,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },

  targetHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },

  targetTrack: {
    width: "100%",
    height: 12,
    background: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },

  targetFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: 10,
    transition: "width 0.3s ease",
  },

  targetPercent: {
    marginTop: 7,
    color: "#6b7280",
    fontSize: 12,
  },

  assignRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginTop: 18,
  },

  input: {
    flex: 1,
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#fff",
    fontSize: 14,
  },

  assignButton: {
    border: 0,
    background: "#059669",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 8,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  averageBox: {
    minWidth: 100,
    textAlign: "center",
    padding: "10px 16px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 10,
  },

  progressSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 10,
  },

  summaryMini: {
    padding: 12,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 9,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  searchBox: {
    marginBottom: 16,
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
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
    minWidth: 1250,
    borderCollapse: "collapse",
  },

  th: {
    padding: "12px 10px",
    background: "#f8fafc",
    borderBottom: "2px solid #e5e7eb",
    textAlign: "left",
    fontSize: 12,
    whiteSpace: "nowrap",
  },

  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 13,
    verticalAlign: "middle",
  },

  progressCell: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 130,
  },

  progressTrack: {
    width: 90,
    height: 8,
    background: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "#059669",
    borderRadius: 10,
  },

  statusBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: 15,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  statusDone: {
    background: "#dcfce7",
    color: "#166534",
  },

  statusNotStarted: {
    background: "#f3f4f6",
    color: "#374151",
  },

  statusProgress: {
    background: "#fef3c7",
    color: "#92400e",
  },

  actionGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    minWidth: 300,
  },

  detailButton: {
    border: 0,
    background: "#374151",
    color: "#fff",
    padding: "8px 10px",
    borderRadius: 7,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
  },

  progressButton: {
    display: "inline-block",
    textDecoration: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "8px 10px",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 12,
  },

  documentButton: {
    display: "inline-block",
    textDecoration: "none",
    background: "#7c3aed",
    color: "#fff",
    padding: "8px 10px",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 12,
  },

  photoButton: {
    display: "inline-block",
    textDecoration: "none",
    background: "#0891b2",
    color: "#fff",
    padding: "8px 10px",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 12,
  },

  releaseButton: {
    border: 0,
    background: "#dc2626",
    color: "#fff",
    padding: "8px 10px",
    borderRadius: 7,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
  },

  emptyBox: {
    textAlign: "center",
    padding: "45px 20px",
    background: "#f8fafc",
    borderRadius: 10,
    color: "#6b7280",
  },

  loadingBox: {
    maxWidth: 600,
    margin: "100px auto",
    padding: 30,
    textAlign: "center",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
  },

  success: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    padding: "13px 16px",
    borderRadius: 9,
    marginBottom: 18,
    fontWeight: 700,
  },

  error: {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: "13px 16px",
    borderRadius: 9,
    marginBottom: 18,
    fontWeight: 700,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: 900,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 20,
  },

  modalTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
  },

  closeButton: {
    border: 0,
    background: "#f3f4f6",
    width: 36,
    height: 36,
    borderRadius: 8,
    fontSize: 25,
    lineHeight: 1,
    cursor: "pointer",
  },

  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },

  modalActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
    paddingTop: 20,
    borderTop: "1px solid #e5e7eb",
  },
};