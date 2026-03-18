"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import authApi from "@/lib/authApi";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authApi.register(form);
      authApi.saveCurrentUser(result);

      if (result.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Qeydiyyat alınmadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", padding: 24 }}>
      <h1>Qeydiyyat</h1>

      <form onSubmit={handleRegister} style={{ display: "grid", gap: 12 }}>
        <input name="fullName" placeholder="Ad soyad" value={form.fullName} onChange={handleChange} style={{ padding: 12 }} />
        <input name="username" placeholder="İstifadəçi adı" value={form.username} onChange={handleChange} style={{ padding: 12 }} />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={{ padding: 12 }} />
        <input name="phone" placeholder="Telefon" value={form.phone} onChange={handleChange} style={{ padding: 12 }} />
        <input name="password" type="password" placeholder="Şifrə" value={form.password} onChange={handleChange} style={{ padding: 12 }} />

        <button type="submit" disabled={loading} style={{ padding: 12 }}>
          {loading ? "Göndərilir..." : "Qeydiyyatdan keç"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </div>
  );
}
