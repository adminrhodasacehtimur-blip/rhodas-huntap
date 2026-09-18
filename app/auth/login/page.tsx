"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }

    // Setelah login langsung ke Dashboard RHODAS
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="loginPage">
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .loginPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            radial-gradient(
              circle at top left,
              rgba(29, 114, 232, 0.12),
              transparent 35%
            ),
            #f4f7fb;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .loginCard {
          width: 100%;
          max-width: 430px;
          background: white;
          border: 1px solid #e4e9f0;
          border-radius: 18px;
          padding: 34px;
          box-shadow: 0 20px 50px rgba(20, 34, 56, 0.09);
        }

        .logo {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          background: #1d72e8;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
          font-weight: 800;
          margin-bottom: 18px;
        }

        .title {
          margin: 0;
          color: #142238;
          font-size: 25px;
          font-weight: 800;
        }

        .subtitle {
          margin: 7px 0 28px;
          color: #7c8798;
          font-size: 13px;
          line-height: 1.6;
        }

        .label {
          display: block;
          margin-bottom: 7px;
          color: #3e4c61;
          font-size: 12px;
          font-weight: 700;
        }

        .input {
          width: 100%;
          height: 46px;
          padding: 0 13px;
          border: 1px solid #dfe5ed;
          border-radius: 10px;
          outline: none;
          background: white;
          color: #26344b;
          font-size: 13px;
        }

        .input:focus {
          border-color: #1d72e8;
          box-shadow: 0 0 0 3px rgba(29, 114, 232, 0.1);
        }

        .field {
          margin-bottom: 17px;
        }

        .loginButton {
          width: 100%;
          height: 47px;
          margin-top: 6px;
          border: 0;
          border-radius: 10px;
          background: #1d72e8;
          color: white;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .loginButton:hover {
          background: #1766d0;
        }

        .loginButton:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .error {
          margin-bottom: 17px;
          padding: 12px 13px;
          border: 1px solid #f0cccc;
          border-radius: 9px;
          background: #fff3f3;
          color: #bd3d3d;
          font-size: 12px;
          line-height: 1.5;
        }

        .footer {
          margin-top: 24px;
          text-align: center;
          color: #9aa4b2;
          font-size: 10px;
          line-height: 1.5;
        }

        @media (max-width: 480px) {
          .loginCard {
            padding: 27px 22px;
          }

          .title {
            font-size: 22px;
          }
        }
      `}</style>

      <div className="loginCard">
        <div className="logo">R</div>

        <h1 className="title">
          RHODAS HUNTAP
        </h1>

        <p className="subtitle">
          Sistem Administrasi Hunian Tetap
          <br />
          PT RHODAS Cabang Aceh Timur
        </p>

        <form onSubmit={handleLogin}>
          <div className="field">
            <label className="label">
              Email
            </label>

            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label className="label">
              Password
            </label>

            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            className="loginButton"
            type="submit"
            disabled={loading}
          >
            {loading ? "Memproses Login..." : "Login"}
          </button>
        </form>

        <div className="footer">
          Sistem Administrasi Huntap
          <br />
          PT RHODAS Cabang Aceh Timur
        </div>
      </div>
    </main>
  );
}