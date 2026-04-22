"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Shield, Lock, ArrowRight, AlertTriangle, Key } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function AdminLoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"az" | "en">("az");

  const dur = reduceMotion ? 0.01 : 0.5;
  const spring = reduceMotion ? { duration: 0.01 } : { type: "spring" as const, stiffness: 360, damping: 26 };

  const t = {
    az: {
      title: "Admin Girişi",
      subtitle: "Premium Reklam Panel",
      username: "İstifadəçi adı",
      password: "Parol",
      submit: "Daxil ol",
      error: "Daxili xəta",
      lang: "AZ",
      back: "İstifadəçi girişi",
    },
    en: {
      title: "Admin Login",
      subtitle: "Premium Reklam Panel",
      username: "Username",
      password: "Password",
      submit: "Sign in",
      error: "Internal error",
      lang: "EN",
      back: "User login",
    },
  };

  const ui = t[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await authApi.login(username, password);

      if (user.role !== "ADMIN") {
        setError(
          lang === "az"
            ? "Bu səhifə yalnız ADMIN hesabı üçündür."
            : "This page is for ADMIN accounts only."
        );
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("premium_subadmin_session");
        sessionStorage.removeItem("premium_subadmin_jwt");
        localStorage.setItem("premium_session_type", "admin");
        localStorage.setItem("decor_current_user", JSON.stringify(user));
      }

      setTimeout(() => {
        router.push("/admin/dashboard");
        router.refresh();
      }, 100);
    } catch (err: unknown) {
      console.error("[Login] Error:", err);
      setError(err instanceof Error ? err.message : ui.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508] flex items-center justify-center py-12 px-4">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-[-20%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[#C41E3A]/20 blur-[100px]"
          animate={
            reduceMotion
              ? {}
              : { x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.05, 1] }
          }
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-15%] bottom-[-20%] h-[380px] w-[380px] rounded-full bg-zinc-700/25 blur-[90px]"
          animate={
            reduceMotion
              ? {}
              : { x: [0, -24, 0], y: [0, -16, 0] }
          }
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.45) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur, ease: easeOut }}
      >
        <Card className="relative overflow-hidden border border-white/10 bg-zinc-900/70 p-8 shadow-[0_28px_64px_-20px_rgba(0,0,0,.65),inset_0_1px_0_0_rgba(255,255,255,.06)] backdrop-blur-2xl md:p-9">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C41E3A]/60 to-transparent" />
          {!reduceMotion && (
            <motion.div
              className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#C41E3A]/15 blur-3xl"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
          )}

          <div className="relative">
            <motion.div
              className="mb-6 flex justify-between items-start"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: reduceMotion ? 0 : 0.04 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C41E3A]/35 bg-gradient-to-br from-[#C41E3A]/25 to-transparent shadow-[0_12px_32px_-8px_rgba(196,30,58,0.45)]"
                  whileHover={reduceMotion ? {} : { scale: 1.05, rotate: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Shield className="h-7 w-7 text-[#f87171]" strokeWidth={1.6} />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">{ui.title}</h1>
                  <p className="text-sm text-zinc-400">{ui.subtitle}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLang(lang === "az" ? "en" : "az")}
                icon={<Key className="h-4 w-4" />}
                className="text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                {ui.lang}
              </Button>
            </motion.div>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key={error}
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.25 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/55 px-3 py-3 text-sm text-red-200 backdrop-blur-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.1 }}
              >
                <Input
                  label={ui.username}
                  placeholder="admin"
                  value={username}
                  onChange={setUsername}
                  icon={<Shield className="h-5 w-5" />}
                  required
                  disabled={loading}
                  className="[&_input]:rounded-xl [&_input]:border-white/10 [&_input]:bg-white/[0.06] [&_input]:text-white [&_input]:placeholder:text-zinc-500 [&_label]:text-zinc-400"
                />
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.15 }}
              >
                <Input
                  label={ui.password}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  icon={<Lock className="h-5 w-5" />}
                  required
                  disabled={loading}
                  className="[&_input]:rounded-xl [&_input]:border-white/10 [&_input]:bg-white/[0.06] [&_input]:text-white [&_input]:placeholder:text-zinc-500 [&_label]:text-zinc-400"
                />
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.2 }}
              >
                <motion.div whileHover={reduceMotion ? {} : { scale: 1.01 }} whileTap={reduceMotion ? {} : { scale: 0.99 }}>
                  <Button
                    type="submit"
                    className="w-full !rounded-xl !bg-gradient-to-r !from-[#C41E3A] !to-[#7f1025] !text-white !border-white/10 !shadow-[0_14px_36px_-10px_rgba(196,30,58,0.5)] hover:!shadow-[0_18px_44px_-10px_rgba(196,30,58,0.6)]"
                    loading={loading}
                    icon={<ArrowRight className="h-5 w-5" />}
                  >
                    {ui.submit}
                  </Button>
                </motion.div>
              </motion.div>
            </form>

            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.3 }}
            >
              <Link
                href="/login"
                className="text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-300 hover:underline"
              >
                ← {ui.back}
              </Link>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
