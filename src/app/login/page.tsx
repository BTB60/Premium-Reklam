"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import authApi from "@/lib/authApi";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authApi.login(username, password);
      authApi.saveCurrentUser(result);

      if (result.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Giriş alınmadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
      padding: 20
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "white",
        borderRadius: 16,
        padding: 40,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, #D90429 0%, #EF476F 100%)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <span style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>P</span>
          </div>
          <h1 style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#1F2937",
            marginBottom: 8,
            fontFamily: "Manrope, sans-serif"
          }}>
            Premium Reklam
          </h1>
          <p style={{ color: "#6B7280", fontSize: 14 }}>
            Hesabınıza daxil olun
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#FEE2E2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            color: "#DC2626",
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
              marginBottom: 8
            }}>
              İstifadəçi adı
            </label>
            <input
              type="text"
              placeholder="admin və ya istifadəçi adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                fontSize: 15,
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#D90429"}
              onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
              marginBottom: 8
            }}>
              Şifrə
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Şifrənizi daxil edin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 50px 14px 16px",
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#D90429"}
                onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                  fontSize: 12
                }}
              >
                {showPassword ? "GIZLƏT" : "GOSTƏR"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#9CA3AF" : "linear-gradient(135deg, #D90429 0%, #EF476F 100%)",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(217, 4, 41, 0.3)";
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{
                  width: 16,
                  height: 16,
                  border: "2px solid white",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }} />
                Yoxlanılır...
              </span>
            ) : "Daxil ol"}
          </button>
        </form>

        {/* Register Link */}
        <p style={{
          textAlign: "center",
          marginTop: 24,
          color: "#6B7280",
          fontSize: 14
        }}>
          Hesabınız yoxdur?{" "}
          <a
            href="/register"
            style={{
              color: "#D90429",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Qeydiyyatdan keçin
          </a>
        </p>


      </div>

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
