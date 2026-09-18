"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

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

type Kontraktor = {
  id: number;
  jenis_perusahaan: string | null;
  nama_perusahaan: string | null;
  nama_direktur: string | null;
  target_huntap: number | null;
  status: string | null;
};

type MenuItem = {
  href: string;
  icon: string;
  label: string;
};

const menuUtama: MenuItem[] = [
  { href: "/", icon: "⌂", label: "Dashboard" },
  { href: "/huntap", icon: "⌂", label: "Data Huntap" },
  { href: "/penerima", icon: "♙", label: "Data Penerima" },
  { href: "/kontraktor", icon: "▣", label: "Data Kontraktor" },
  { href: "/progress", icon: "↗", label: "Progress Pembangunan" },
  { href: "/dokumen", icon: "▤", label: "Dokumen" },
  { href: "/dokumentasi", icon: "▧", label: "Dokumentasi Foto" },
  { href: "/laporan", icon: "▥", label: "Laporan" },
];

function formatPersen(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function getStatusLabel(status: string | null) {
  if (!status) return "Belum Mulai";

  const value = status.toLowerCase();

  if (value === "selesai" || value === "selesai 100%") {
    return "Selesai";
  }

  if (value.includes("pembangunan") || value.includes("proses")) {
    return "Sedang Pembangunan";
  }

  return status;
}

function getStatusClass(status: string | null) {
  const label = getStatusLabel(status);

  if (label === "Selesai") return "statusSelesai";
  if (label === "Sedang Pembangunan") return "statusProses";

  return "statusBelum";
}

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [huntap, setHuntap] = useState<Huntap[]>([]);
  const [kontraktor, setKontraktor] = useState<Kontraktor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");

    const [
      { data: huntapData, error: huntapError },
      { data: kontraktorData, error: kontraktorError },
    ] = await Promise.all([
      supabase
        .from("huntap")
        .select(`
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
        `)
        .order("id", { ascending: false }),

      supabase
        .from("kontraktor")
        .select(`
          id,
          jenis_perusahaan,
          nama_perusahaan,
          nama_direktur,
          target_huntap,
          status
        `)
        .order("id", { ascending: true }),
    ]);

    if (huntapError) {
      setErrorMessage(`Gagal mengambil data Huntap: ${huntapError.message}`);
      setLoading(false);
      return;
    }

    if (kontraktorError) {
      setErrorMessage(
        `Gagal mengambil data kontraktor: ${kontraktorError.message}`
      );
      setLoading(false);
      return;
    }

    setHuntap((huntapData || []) as Huntap[]);
    setKontraktor((kontraktorData || []) as Kontraktor[]);
    setLoading(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(`Gagal keluar: ${error.message}`);
      setLoggingOut(false);
      return;
    }

    router.replace("/auth/login");
    router.refresh();
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalHuntap = huntap.length;

  const huntapBelumMulai = huntap.filter(
    (item) => getStatusLabel(item.status) === "Belum Mulai"
  ).length;

  const huntapSelesai = huntap.filter(
    (item) => getStatusLabel(item.status) === "Selesai"
  ).length;

  const huntapSedangPembangunan = huntap.filter(
    (item) => getStatusLabel(item.status) === "Sedang Pembangunan"
  ).length;

  const rataRataProgress =
    totalHuntap > 0
      ? Math.round(
          huntap.reduce(
            (total, item) => total + Number(item.progress || 0),
            0
          ) / totalHuntap
        )
      : 0;

  const totalTargetKontraktor = kontraktor.reduce(
    (total, item) => total + Number(item.target_huntap || 0),
    0
  );

  const huntapSudahDitugaskan = huntap.filter(
    (item) => item.kontraktor_id !== null
  ).length;

  const huntapBelumDitugaskan = huntap.filter(
    (item) => item.kontraktor_id === null
  ).length;

  const persentasePenugasan =
    totalHuntap > 0
      ? Math.round((huntapSudahDitugaskan / totalHuntap) * 100)
      : 0;

  const persentaseBelumMulai =
    totalHuntap > 0
      ? Math.round((huntapBelumMulai / totalHuntap) * 100)
      : 0;

  const persentasePembangunan =
    totalHuntap > 0
      ? Math.round((huntapSedangPembangunan / totalHuntap) * 100)
      : 0;

  const persentaseSelesai =
    totalHuntap > 0
      ? Math.round((huntapSelesai / totalHuntap) * 100)
      : 0;

  const kontraktorSummary = useMemo(() => {
    return kontraktor.map((item) => {
      const dataHuntap = huntap.filter(
        (h) => Number(h.kontraktor_id) === Number(item.id)
      );

      const jumlahHuntap = dataHuntap.length;

      const averageProgress =
        jumlahHuntap > 0
          ? Math.round(
              dataHuntap.reduce(
                (total, h) => total + Number(h.progress || 0),
                0
              ) / jumlahHuntap
            )
          : 0;

      const target = Number(item.target_huntap || 0);

      const pencapaian =
        target > 0 ? Math.round((jumlahHuntap / target) * 100) : 0;

      return {
        ...item,
        jumlahHuntap,
        averageProgress,
        pencapaian,
      };
    });
  }, [kontraktor, huntap]);

  const progressDistribution = [
    {
      label: "0%",
      count: huntap.filter((item) => Number(item.progress || 0) === 0).length,
    },
    {
      label: "1–25%",
      count: huntap.filter((item) => {
        const p = Number(item.progress || 0);
        return p >= 1 && p <= 25;
      }).length,
    },
    {
      label: "26–50%",
      count: huntap.filter((item) => {
        const p = Number(item.progress || 0);
        return p >= 26 && p <= 50;
      }).length,
    },
    {
      label: "51–75%",
      count: huntap.filter((item) => {
        const p = Number(item.progress || 0);
        return p >= 51 && p <= 75;
      }).length,
    },
    {
      label: "76–99%",
      count: huntap.filter((item) => {
        const p = Number(item.progress || 0);
        return p >= 76 && p <= 99;
      }).length,
    },
    {
      label: "100%",
      count: huntap.filter((item) => Number(item.progress || 0) === 100)
        .length,
    },
  ];

  const maxDistribution = Math.max(
    ...progressDistribution.map((item) => item.count),
    1
  );

  function getKontraktorName(kontraktorId: number | null) {
    if (kontraktorId === null) return null;

    const found = kontraktor.find(
      (item) => Number(item.id) === Number(kontraktorId)
    );

    return found?.nama_perusahaan || "Kontraktor";
  }

  return (
    <div className="dashboard">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f4f7fb;
          color: #172033;
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        a {
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }

        .dashboard {
          min-height: 100vh;
          background: #f4f7fb;
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 260px;
          background: #0f1f35;
          color: white;
          z-index: 100;
          display: flex;
          flex-direction: column;
          box-shadow: 8px 0 30px rgba(15, 31, 53, 0.08);
        }

        .brand {
          height: 82px;
          padding: 0 22px;
          display: flex;
          align-items: center;
          gap: 13px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brandLogo {
          width: 43px;
          height: 43px;
          border-radius: 12px;
          background: #1d72e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          font-weight: 800;
        }

        .brandTitle {
          font-size: 15px;
          font-weight: 800;
        }

        .brandSubtitle {
          font-size: 11px;
          color: #91a3bc;
          margin-top: 3px;
        }

        .menuTitle {
          padding: 25px 22px 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #71849f;
        }

        .menu {
          padding: 0 12px;
          overflow-y: auto;
        }

        .menuItem {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 46px;
          padding: 0 13px;
          border-radius: 10px;
          color: #b7c4d6;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
          transition: 0.2s ease;
        }

        .menuItem:hover {
          background: rgba(255, 255, 255, 0.07);
          color: white;
        }

        .menuItem.active {
          background: #1d72e8;
          color: white;
        }

        .menuIcon {
          width: 26px;
          text-align: center;
          font-size: 18px;
        }

        .sidebarBottom {
          margin-top: auto;
          padding: 15px;
        }

        .systemBox {
          padding: 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .systemBoxTitle {
          font-size: 11px;
          color: #8fa1b9;
        }

        .systemBoxText {
          margin-top: 5px;
          font-size: 12px;
          font-weight: 700;
        }

        .main {
          margin-left: 260px;
          min-height: 100vh;
        }

        .topbar {
          height: 82px;
          background: white;
          border-bottom: 1px solid #e7ebf1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 34px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .topTitle {
          font-size: 18px;
          font-weight: 800;
        }

        .topSubtitle {
          font-size: 12px;
          color: #7c8798;
          margin-top: 4px;
        }

        .topRight {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .refreshButton,
        .logoutButton {
          height: 38px;
          padding: 0 13px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .refreshButton {
          border: 1px solid #dfe5ed;
          background: white;
          color: #445269;
        }

        .logoutButton {
          border: 1px solid #f0caca;
          background: #fff5f5;
          color: #c43d3d;
        }

        .refreshButton:disabled,
        .logoutButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .adminBadge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 9px 5px 6px;
          border: 1px solid #e5e9ef;
          border-radius: 30px;
        }

        .adminAvatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #eaf3ff;
          color: #1769d2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        .adminText {
          font-size: 11px;
          font-weight: 700;
          color: #455267;
        }

        .content {
          padding: 30px 34px 45px;
          max-width: 1700px;
        }

        .welcome {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 25px;
        }

        .welcomeTitle {
          margin: 0;
          font-size: 27px;
          color: #142238;
        }

        .welcomeText {
          margin: 7px 0 0;
          color: #7c8798;
          font-size: 13px;
        }

        .dateBadge {
          background: white;
          border: 1px solid #e3e8ef;
          padding: 10px 14px;
          border-radius: 10px;
          color: #5c687b;
          font-size: 12px;
          font-weight: 600;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .statCard,
        .card {
          background: white;
          border: 1px solid #e5eaf0;
          border-radius: 14px;
          box-shadow: 0 4px 18px rgba(26, 42, 65, 0.035);
        }

        .statCard {
          padding: 19px;
        }

        .statTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .statLabel {
          font-size: 11px;
          font-weight: 700;
          color: #7b8798;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .statIcon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
        }

        .blueIcon {
          background: #eaf3ff;
          color: #1769d2;
        }

        .orangeIcon {
          background: #fff5e6;
          color: #d98512;
        }

        .purpleIcon {
          background: #f1edff;
          color: #6f52c9;
        }

        .greenIcon {
          background: #e8f8ef;
          color: #18864b;
        }

        .grayIcon {
          background: #edf1f5;
          color: #687486;
        }

        .statValue {
          margin-top: 14px;
          font-size: 29px;
          font-weight: 800;
        }

        .statFooter {
          margin-top: 10px;
          font-size: 11px;
          color: #8993a3;
        }

        .grid2 {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.65fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .cardHeader {
          padding: 20px 21px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #edf0f4;
        }

        .cardTitle {
          font-size: 14px;
          font-weight: 800;
        }

        .cardSubtitle {
          font-size: 11px;
          color: #8993a3;
          margin-top: 4px;
        }

        .cardBody {
          padding: 20px 21px;
        }

        .bigProgress {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .progressCircle {
          width: 128px;
          height: 128px;
          flex: 0 0 128px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: conic-gradient(
            #1d72e8 ${rataRataProgress}%,
            #e8edf4 0
          );
        }

        .progressCircle::before {
          content: "";
          width: 98px;
          height: 98px;
          border-radius: 50%;
          background: white;
          position: absolute;
        }

        .circleText {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .circleNumber {
          font-size: 27px;
          font-weight: 800;
        }

        .circleLabel {
          font-size: 10px;
          color: #8a94a4;
        }

        .progressDetails {
          flex: 1;
        }

        .detailRow {
          margin-bottom: 15px;
        }

        .detailHeader {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .detailName {
          font-size: 11px;
          color: #667286;
          font-weight: 600;
        }

        .detailValue {
          font-size: 11px;
          color: #27364e;
          font-weight: 800;
        }

        .bar {
          height: 7px;
          background: #edf1f5;
          border-radius: 10px;
          overflow: hidden;
        }

        .barFill {
          height: 100%;
          border-radius: 10px;
        }

        .blueFill {
          background: #1d72e8;
        }

        .orangeFill {
          background: #e6a13a;
        }

        .greenFill {
          background: #28a568;
        }

        .grayFill {
          background: #aab4c2;
        }

        .quickGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .quickAction {
          display: block;
          padding: 15px;
          border: 1px solid #e5eaf0;
          border-radius: 11px;
          background: #fafbfd;
        }

        .quickIcon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #eaf3ff;
          color: #1769d2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          margin-bottom: 10px;
        }

        .quickTitle {
          font-size: 12px;
          font-weight: 800;
          color: #26344b;
        }

        .quickDesc {
          font-size: 10px;
          color: #8993a3;
          margin-top: 3px;
        }

        .assignmentGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .assignmentBox {
          border: 1px solid #e7ebf1;
          background: #fafbfd;
          border-radius: 11px;
          padding: 15px;
        }

        .assignmentNumber {
          font-size: 23px;
          font-weight: 800;
        }

        .assignmentLabel {
          font-size: 10px;
          color: #8a94a4;
          margin-top: 3px;
        }

        .assignmentPercent {
          font-size: 10px;
          font-weight: 800;
          color: #1769d2;
          margin-top: 12px;
        }

        .contractorGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .contractorCard {
          border: 1px solid #e5eaf0;
          border-radius: 12px;
          padding: 17px;
        }

        .contractorHead {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .contractorLogo {
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          border-radius: 11px;
          background: #eef4fb;
          color: #245e9e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .contractorName {
          font-size: 13px;
          font-weight: 800;
        }

        .contractorType {
          font-size: 10px;
          color: #8993a3;
          margin-top: 3px;
        }

        .contractorStats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 17px;
        }

        .contractorStat {
          background: #f8fafc;
          border-radius: 8px;
          padding: 9px;
        }

        .contractorStatNumber {
          font-size: 16px;
          font-weight: 800;
        }

        .contractorStatLabel {
          font-size: 9px;
          color: #8a94a4;
          margin-top: 2px;
        }

        .contractorProgress {
          margin-top: 15px;
        }

        .contractorProgressHeader {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          color: #718096;
          margin-bottom: 6px;
        }

        .contractorButton {
          display: inline-flex;
          margin-top: 14px;
          padding: 8px 12px;
          border-radius: 8px;
          background: #eaf3ff;
          color: #1769d2;
          font-size: 10px;
          font-weight: 800;
        }

        .distribution {
          display: flex;
          align-items: flex-end;
          gap: 14px;
          height: 190px;
          padding-top: 15px;
        }

        .distributionItem {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          gap: 7px;
        }

        .distributionCount {
          font-size: 11px;
          font-weight: 800;
          color: #526075;
        }

        .distributionBarArea {
          height: 135px;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .distributionBar {
          width: min(38px, 70%);
          border-radius: 7px 7px 3px 3px;
          background: #5a91d8;
          min-height: 5px;
        }

        .distributionLabel {
          font-size: 10px;
          color: #7c8798;
          font-weight: 700;
        }

        .tableCard {
          overflow: hidden;
        }

        .tableWrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e6ebf1;
          color: #7b8798;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          white-space: nowrap;
        }

        td {
          padding: 13px 16px;
          border-bottom: 1px solid #eef1f4;
          font-size: 11px;
          color: #455267;
          white-space: nowrap;
        }

        .kode {
          font-weight: 800;
          color: #1d5fae;
        }

        .recipient {
          font-weight: 700;
          color: #27364e;
        }

        .status {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
        }

        .statusSelesai {
          background: #e8f7ef;
          color: #19864d;
        }

        .statusProses {
          background: #fff4df;
          color: #b46d09;
        }

        .statusBelum {
          background: #edf1f5;
          color: #687486;
        }

        .tableProgress {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 115px;
        }

        .tableProgressBar {
          width: 72px;
          height: 6px;
          background: #e9edf2;
          border-radius: 10px;
          overflow: hidden;
        }

        .tableProgressFill {
          height: 100%;
          background: #2878d7;
          border-radius: 10px;
        }

        .tableProgressText {
          font-size: 10px;
          font-weight: 800;
        }

        .empty {
          text-align: center;
          padding: 45px 20px;
          color: #8b95a5;
          font-size: 12px;
        }

        .errorBox {
          padding: 15px 18px;
          background: #fff2f2;
          border: 1px solid #f3cccc;
          border-radius: 10px;
          color: #b53d3d;
          font-size: 12px;
          margin-bottom: 20px;
        }

        .footer {
          text-align: center;
          color: #9aa4b2;
          font-size: 10px;
          padding-top: 20px;
        }

        .mobileMenuButton {
          display: none;
          border: 0;
          background: #eef4fb;
          color: #1d5fae;
          width: 38px;
          height: 38px;
          border-radius: 9px;
          font-size: 20px;
          cursor: pointer;
        }

        @media (max-width: 1250px) {
          .statsGrid {
            grid-template-columns: repeat(3, 1fr);
          }

          .grid2 {
            grid-template-columns: 1fr;
          }

          .contractorGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .sidebar {
            transform: translateX(-100%);
            transition: 0.25s ease;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .main {
            margin-left: 0;
          }

          .mobileMenuButton {
            display: block;
          }

          .topbar {
            padding: 0 18px;
          }

          .content {
            padding: 22px 18px 35px;
          }

          .statsGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .welcome {
            align-items: flex-start;
            gap: 15px;
            flex-direction: column;
          }
        }

        @media (max-width: 600px) {
          .statsGrid {
            grid-template-columns: 1fr;
          }

          .assignmentGrid {
            grid-template-columns: 1fr;
          }

          .bigProgress {
            flex-direction: column;
            align-items: flex-start;
          }

          .quickGrid {
            grid-template-columns: 1fr;
          }

          .contractorStats {
            grid-template-columns: 1fr;
          }

          .adminText {
            display: none;
          }

          .dateBadge {
            display: none;
          }

          .topRight {
            gap: 5px;
          }

          .refreshButton {
            padding: 0 8px;
          }

          .logoutButton {
            padding: 0 8px;
          }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brandLogo">R</div>

          <div>
            <div className="brandTitle">PT RHODAS</div>
            <div className="brandSubtitle">Cabang Aceh Timur</div>
          </div>
        </div>

        <div className="menuTitle">Menu Utama</div>

        <nav className="menu">
          {menuUtama.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`menuItem ${item.href === "/" ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="menuIcon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebarBottom">
          <div className="systemBox">
            <div className="systemBoxTitle">Sistem Administrasi</div>
            <div className="systemBoxText">HUNTAP ACEH TIMUR</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="topbar">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              className="mobileMenuButton"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              type="button"
            >
              ☰
            </button>

            <div>
              <div className="topTitle">
                Dashboard Administrasi Huntap
              </div>

              <div className="topSubtitle">
                Monitoring administrasi dan pembangunan Hunian Tetap
              </div>
            </div>
          </div>

          <div className="topRight">
            <button
              className="refreshButton"
              onClick={loadDashboard}
              disabled={loading || loggingOut}
              type="button"
            >
              ↻ {loading ? "Memuat..." : "Refresh"}
            </button>

            <div className="adminBadge">
              <div className="adminAvatar">A</div>

              <div className="adminText">
                Admin Cabang
              </div>
            </div>

            <button
              className="logoutButton"
              onClick={handleLogout}
              disabled={loggingOut}
              type="button"
            >
              {loggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </header>

        <section className="content">
          {/* WELCOME */}
          <div className="welcome">
            <div>
              <h1 className="welcomeTitle">
                Selamat Datang 👋
              </h1>

              <p className="welcomeText">
                Pantau kondisi pembangunan Huntap, penugasan kontraktor,
                dan administrasi proyek dari satu halaman.
              </p>
            </div>

            <div className="dateBadge">
              Sistem Informasi Huntap • Aceh Timur
            </div>
          </div>

          {errorMessage && (
            <div className="errorBox">
              {errorMessage}
            </div>
          )}

          {/* STATISTICS */}
          <div className="statsGrid">
            <div className="statCard">
              <div className="statTop">
                <div className="statLabel">Total Huntap</div>
                <div className="statIcon blueIcon">⌂</div>
              </div>

              <div className="statValue">
                {totalHuntap}
              </div>

              <div className="statFooter">
                Seluruh unit terdaftar
              </div>
            </div>

            <div className="statCard">
              <div className="statTop">
                <div className="statLabel">Belum Mulai</div>
                <div className="statIcon grayIcon">○</div>
              </div>

              <div className="statValue">
                {huntapBelumMulai}
              </div>

              <div className="statFooter">
                {persentaseBelumMulai}% dari total Huntap
              </div>
            </div>

            <div className="statCard">
              <div className="statTop">
                <div className="statLabel">Pembangunan</div>
                <div className="statIcon orangeIcon">↗</div>
              </div>

              <div className="statValue">
                {huntapSedangPembangunan}
              </div>

              <div className="statFooter">
                {persentasePembangunan}% sedang dikerjakan
              </div>
            </div>

            <div className="statCard">
              <div className="statTop">
                <div className="statLabel">Selesai</div>
                <div className="statIcon greenIcon">✓</div>
              </div>

              <div className="statValue">
                {huntapSelesai}
              </div>

              <div className="statFooter">
                {persentaseSelesai}% sudah selesai
              </div>
            </div>

            <div className="statCard">
              <div className="statTop">
                <div className="statLabel">
                  Rata-rata Progress
                </div>

                <div className="statIcon purpleIcon">%</div>
              </div>

              <div className="statValue">
                {rataRataProgress}%
              </div>

              <div className="statFooter">
                Progress keseluruhan Huntap
              </div>
            </div>
          </div>

          {/* PROGRESS + QUICK ACTION */}
          <div className="grid2">
            <div className="card">
              <div className="cardHeader">
                <div>
                  <div className="cardTitle">
                    Progress Pembangunan
                  </div>

                  <div className="cardSubtitle">
                    Kondisi keseluruhan pembangunan Huntap
                  </div>
                </div>
              </div>

              <div className="cardBody">
                <div className="bigProgress">
                  <div className="progressCircle">
                    <div className="circleText">
                      <div className="circleNumber">
                        {rataRataProgress}%
                      </div>

                      <div className="circleLabel">
                        Progress
                      </div>
                    </div>
                  </div>

                  <div className="progressDetails">
                    <div className="detailRow">
                      <div className="detailHeader">
                        <span className="detailName">
                          Belum Mulai
                        </span>

                        <span className="detailValue">
                          {huntapBelumMulai} unit
                        </span>
                      </div>

                      <div className="bar">
                        <div
                          className="barFill grayFill"
                          style={{
                            width: `${persentaseBelumMulai}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="detailRow">
                      <div className="detailHeader">
                        <span className="detailName">
                          Sedang Pembangunan
                        </span>

                        <span className="detailValue">
                          {huntapSedangPembangunan} unit
                        </span>
                      </div>

                      <div className="bar">
                        <div
                          className="barFill orangeFill"
                          style={{
                            width: `${persentasePembangunan}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="detailRow">
                      <div className="detailHeader">
                        <span className="detailName">
                          Selesai
                        </span>

                        <span className="detailValue">
                          {huntapSelesai} unit
                        </span>
                      </div>

                      <div className="bar">
                        <div
                          className="barFill greenFill"
                          style={{
                            width: `${persentaseSelesai}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <div>
                  <div className="cardTitle">
                    Akses Cepat
                  </div>

                  <div className="cardSubtitle">
                    Menu yang sering digunakan
                  </div>
                </div>
              </div>

              <div className="cardBody">
                <div className="quickGrid">
                  <Link href="/huntap" className="quickAction">
                    <div className="quickIcon">⌂</div>
                    <div className="quickTitle">
                      Data Huntap
                    </div>
                    <div className="quickDesc">
                      Kelola data unit Huntap
                    </div>
                  </Link>

                  <Link
                    href="/kontraktor"
                    className="quickAction"
                  >
                    <div className="quickIcon">▣</div>
                    <div className="quickTitle">
                      Kontraktor
                    </div>
                    <div className="quickDesc">
                      Kelola perusahaan pelaksana
                    </div>
                  </Link>

                  <Link
                    href="/progress"
                    className="quickAction"
                  >
                    <div className="quickIcon">↗</div>
                    <div className="quickTitle">
                      Update Progress
                    </div>
                    <div className="quickDesc">
                      Perbarui progres pembangunan
                    </div>
                  </Link>

                  <Link
                    href="/laporan"
                    className="quickAction"
                  >
                    <div className="quickIcon">▥</div>
                    <div className="quickTitle">
                      Laporan
                    </div>
                    <div className="quickDesc">
                      Lihat dan ekspor laporan
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* PENUGASAN */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="cardHeader">
              <div>
                <div className="cardTitle">
                  Ringkasan Penugasan Huntap
                </div>

                <div className="cardSubtitle">
                  Distribusi Huntap kepada kontraktor
                </div>
              </div>
            </div>

            <div className="cardBody">
              <div className="assignmentGrid">
                <div className="assignmentBox">
                  <div className="assignmentNumber">
                    {totalTargetKontraktor}
                  </div>

                  <div className="assignmentLabel">
                    Target seluruh kontraktor
                  </div>
                </div>

                <div className="assignmentBox">
                  <div className="assignmentNumber">
                    {huntapSudahDitugaskan}
                  </div>

                  <div className="assignmentLabel">
                    Sudah ditugaskan
                  </div>

                  <div className="assignmentPercent">
                    {persentasePenugasan}% dari total
                  </div>
                </div>

                <div className="assignmentBox">
                  <div className="assignmentNumber">
                    {huntapBelumDitugaskan}
                  </div>

                  <div className="assignmentLabel">
                    Belum ditugaskan
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 17 }}>
                <div className="detailHeader">
                  <span className="detailName">
                    Tingkat penugasan Huntap
                  </span>

                  <span className="detailValue">
                    {persentasePenugasan}%
                  </span>
                </div>

                <div className="bar">
                  <div
                    className="barFill blueFill"
                    style={{
                      width: `${persentasePenugasan}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KONTRAKTOR */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="cardHeader">
              <div>
                <div className="cardTitle">
                  Ringkasan Kontraktor
                </div>

                <div className="cardSubtitle">
                  Monitoring penugasan dan progress setiap kontraktor
                </div>
              </div>

              <Link
                href="/kontraktor"
                className="contractorButton"
                style={{ marginTop: 0 }}
              >
                Lihat Semua
              </Link>
            </div>

            <div className="cardBody">
              {kontraktorSummary.length === 0 ? (
                <div className="empty">
                  Belum ada data kontraktor.
                </div>
              ) : (
                <div className="contractorGrid">
                  {kontraktorSummary.map((item) => {
                    const initials =
                      (item.nama_perusahaan || "K")
                        .trim()
                        .substring(0, 2)
                        .toUpperCase();

                    return (
                      <div
                        className="contractorCard"
                        key={item.id}
                      >
                        <div className="contractorHead">
                          <div className="contractorLogo">
                            {initials}
                          </div>

                          <div>
                            <div className="contractorName">
                              {item.nama_perusahaan || "-"}
                            </div>

                            <div className="contractorType">
                              {item.jenis_perusahaan ||
                                "Perusahaan"}

                              {item.nama_direktur
                                ? ` • Direktur: ${item.nama_direktur}`
                                : ""}
                            </div>
                          </div>
                        </div>

                        <div className="contractorStats">
                          <div className="contractorStat">
                            <div className="contractorStatNumber">
                              {item.jumlahHuntap}
                            </div>

                            <div className="contractorStatLabel">
                              Ditugaskan
                            </div>
                          </div>

                          <div className="contractorStat">
                            <div className="contractorStatNumber">
                              {Number(
                                item.target_huntap || 0
                              )}
                            </div>

                            <div className="contractorStatLabel">
                              Target
                            </div>
                          </div>

                          <div className="contractorStat">
                            <div className="contractorStatNumber">
                              {item.averageProgress}%
                            </div>

                            <div className="contractorStatLabel">
                              Progress
                            </div>
                          </div>
                        </div>

                        <div className="contractorProgress">
                          <div className="contractorProgressHeader">
                            <span>
                              Pencapaian target Huntap
                            </span>

                            <span>
                              {Math.min(
                                item.pencapaian,
                                100
                              )}
                              %
                            </span>
                          </div>

                          <div className="bar">
                            <div
                              className="barFill blueFill"
                              style={{
                                width: `${Math.min(
                                  item.pencapaian,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <Link
                          href={`/kontraktor/${item.id}`}
                          className="contractorButton"
                        >
                          Kelola Huntap →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* DISTRIBUSI */}
          <div className="grid2">
            <div className="card">
              <div className="cardHeader">
                <div>
                  <div className="cardTitle">
                    Distribusi Progress Huntap
                  </div>

                  <div className="cardSubtitle">
                    Jumlah unit berdasarkan persentase progress
                  </div>
                </div>
              </div>

              <div className="cardBody">
                <div className="distribution">
                  {progressDistribution.map((item) => {
                    const height =
                      item.count > 0
                        ? Math.max(
                            8,
                            (item.count / maxDistribution) * 100
                          )
                        : 4;

                    return (
                      <div
                        className="distributionItem"
                        key={item.label}
                      >
                        <div className="distributionCount">
                          {item.count}
                        </div>

                        <div className="distributionBarArea">
                          <div
                            className="distributionBar"
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <div className="distributionLabel">
                          {item.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KONDISI */}
            <div className="card">
              <div className="cardHeader">
                <div>
                  <div className="cardTitle">
                    Kondisi Pembangunan
                  </div>

                  <div className="cardSubtitle">
                    Ringkasan status seluruh Huntap
                  </div>
                </div>
              </div>

              <div className="cardBody">
                <div className="detailRow">
                  <div className="detailHeader">
                    <span className="detailName">
                      Belum Mulai
                    </span>

                    <span className="detailValue">
                      {huntapBelumMulai} unit
                    </span>
                  </div>

                  <div className="bar">
                    <div
                      className="barFill grayFill"
                      style={{
                        width: `${persentaseBelumMulai}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="detailRow">
                  <div className="detailHeader">
                    <span className="detailName">
                      Sedang Pembangunan
                    </span>

                    <span className="detailValue">
                      {huntapSedangPembangunan} unit
                    </span>
                  </div>

                  <div className="bar">
                    <div
                      className="barFill orangeFill"
                      style={{
                        width: `${persentasePembangunan}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="detailRow">
                  <div className="detailHeader">
                    <span className="detailName">
                      Selesai
                    </span>

                    <span className="detailValue">
                      {huntapSelesai} unit
                    </span>
                  </div>

                  <div className="bar">
                    <div
                      className="barFill greenFill"
                      style={{
                        width: `${persentaseSelesai}%`,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    padding: 14,
                    borderRadius: 10,
                    background: "#f7f9fc",
                    border: "1px solid #e8edf3",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#8993a3",
                      fontWeight: 700,
                    }}
                  >
                    STATUS DATA
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#26344b",
                    }}
                  >
                    {loading
                      ? "Sedang memuat data..."
                      : `${totalHuntap} unit Huntap terdata`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DATA HUNTAP TERBARU */}
          <div className="card tableCard">
            <div className="cardHeader">
              <div>
                <div className="cardTitle">
                  Data Huntap Terbaru
                </div>

                <div className="cardSubtitle">
                  Daftar unit Huntap yang terakhir terdata
                </div>
              </div>

              <Link
                href="/huntap"
                className="contractorButton"
                style={{ marginTop: 0 }}
              >
                Buka Data Huntap →
              </Link>
            </div>

            <div className="tableWrap">
              {loading ? (
                <div className="empty">
                  Memuat data Huntap...
                </div>
              ) : huntap.length === 0 ? (
                <div className="empty">
                  Belum ada data Huntap.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Kode Huntap</th>
                      <th>No. Unit</th>
                      <th>Nama Penerima</th>
                      <th>Desa</th>
                      <th>Kontraktor</th>
                      <th>Status</th>
                      <th>Progress</th>
                    </tr>
                  </thead>

                  <tbody>
                    {huntap.slice(0, 10).map((item, index) => {
                      const progress = Number(
                        item.progress || 0
                      );

                      return (
                        <tr key={item.id}>
                          <td>{index + 1}</td>

                          <td className="kode">
                            {item.kode_huntap || "-"}
                          </td>

                          <td>
                            {item.nomor_unit || "-"}
                          </td>

                          <td className="recipient">
                            {item.nama_penerima || "-"}
                          </td>

                          <td>
                            {item.desa || "-"}
                          </td>

                          <td>
                            {getKontraktorName(
                              item.kontraktor_id
                            ) || (
                              <span
                                style={{
                                  color: "#a0a8b5",
                                }}
                              >
                                Belum ditugaskan
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              className={`status ${getStatusClass(
                                item.status
                              )}`}
                            >
                              {getStatusLabel(
                                item.status
                              )}
                            </span>
                          </td>

                          <td>
                            <div className="tableProgress">
                              <div className="tableProgressBar">
                                <div
                                  className="tableProgressFill"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(
                                        progress,
                                        100
                                      )
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="tableProgressText">
                                {formatPersen(progress)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="footer">
            Sistem Administrasi Huntap • PT RHODAS Cabang Aceh Timur
          </div>
        </section>
      </main>
    </div>
  );
}