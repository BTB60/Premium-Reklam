"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import authApi from "@/lib/authApi";
import { subadminAuth } from "@/lib/subadminAuth";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dur = reduceMotion ? 0.01 : 0.55;
  const spring = reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 380, damping: 28 };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authApi.login(username, password);

      if (result.role === "SUBADMIN" && typeof window !== "undefined") {
        const permissions = subadminAuth.mapPermissions(result.permissions);
        const session = {
          subadminId: String(result.userId),
          login: result.username,
          role: "SUBADMIN" as const,
          permissions,
          lastLogin: new Date().toISOString(),
        };
        localStorage.removeItem("decor_current_user");
        localStorage.setItem("premium_session_type", "subadmin");
        sessionStorage.setItem("premium_subadmin_session", JSON.stringify(session));
        sessionStorage.setItem(
          "premium_subadmin_jwt",
          JSON.stringify({
            token: result.token,
            subadminId: String(result.userId),
            login: result.username,
            role: "SUBADMIN" as const,
            permissions,
            expiresAt: subadminAuth.extractExpiry(result.token),
          })
        );
        router.push("/admin/dashboard");
        router.refresh();
        return;
      }

      authApi.saveCurrentUser(result);

      if (result.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Giriş alınmadı";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#070a12] text-zinc-100 flex items-center justify-center px-4 py-14">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-1/4 top-0 h-[min(90vw,520px)] w-[min(90vw,520px)] rounded-full bg-[#C41E3A]/25 blur-[100px]"
          animate={
            reduceMotion
              ? {}
              : {
                  x: [0, 40, 0],
                  y: [0, 24, 0],
                  scale: [1, 1.06, 1],
                }
          }
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-1/4 bottom-0 h-[min(85vw,480px)] w-[min(85vw,480px)] rounded-full bg-violet-600/20 blur-[100px]"
          animate={
            reduceMotion
              ? {}
              : {
                  x: [0, -36, 0],
                  y: [0, -20, 0],
                  scale: [1, 1.08, 1],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[min(70vw,380px)] w-[min(70vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-[90px]"
          animate={reduceMotion ? {} : { opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-[440px]"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur, ease: easeOut }}
      >
        <motion.div
          layout
          className={cn(
            "relative overflow-hidden rounded-[1.75rem] border border-white/[0.12]",
            "bg-zinc-900/55 shadow-[0_32px_64px_-16px_rgba(0,0,0,.55),inset_0_1px_0_0_rgba(255,255,255,.06)]",
            "backdrop-blur-2xl px-8 py-10 md:px-10 md:py-11"
          )}
        >
          {/* Top shine */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-[1.75rem] opacity-0 hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "linear-gradient(135deg, rgba(196,30,58,0.35), transparent 40%, transparent 60%, rgba(139,92,246,0.2))",
            }}
            aria-hidden
          />

          <div className="relative">
            <motion.div
              className="mb-8 text-center"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: reduceMotion ? 0 : 0.05 }}
            >
              <motion.div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C41E3A] to-[#7f1d1d] shadow-[0_12px_40px_-8px_rgba(196,30,58,0.65)] ring-1 ring-white/20"
                whileHover={reduceMotion ? {} : { scale: 1.04, rotate: -2 }}
                whileTap={reduceMotion ? {} : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <Sparkles className="h-8 w-8 text-white" strokeWidth={1.75} />
              </motion.div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-[1.65rem]">
                Premium Reklam
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Hesabınıza təhlükəsiz giriş
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key={error}
                  role="alert"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: easeOut }}
                  className="overflow-hidden rounded-xl border border-red-500/35 bg-red-950/50 px-4 py-3 text-sm text-red-200 backdrop-blur-sm"
                >
                  {error}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.1 }}
              >
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  İstifadəçi adı və ya email
                </label>
                <input
                  type="text"
                  placeholder="məs. dekorator və ya email@..."
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className={cn(
                    "w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-[15px] text-white",
                    "placeholder:text-zinc-500 outline-none transition-[border-color,box-shadow,background] duration-200",
                    "focus:border-[#C41E3A]/50 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(196,30,58,0.2)]",
                    "disabled:cursor-not-allowed disabled:opacity-55"
                  )}
                />
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.16 }}
              >
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Şifrə
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={cn(
                      "w-full rounded-xl border border-white/10 bg-white/[0.06] py-3.5 pl-4 pr-12 text-[15px] text-white",
                      "placeholder:text-zinc-500 outline-none transition-[border-color,box-shadow,background] duration-200",
                      "focus:border-[#C41E3A]/50 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(196,30,58,0.2)]",
                      "disabled:cursor-not-allowed disabled:opacity-55"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
                    aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.22 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={reduceMotion || loading ? {} : { scale: 1.02, y: -1 }}
                  whileTap={reduceMotion || loading ? {} : { scale: 0.98 }}
                  className={cn(
                    "relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-[15px] font-semibold text-white",
                    "bg-gradient-to-r from-[#C41E3A] via-[#a01830] to-[#7f1025]",
                    "shadow-[0_14px_36px_-10px_rgba(196,30,58,0.55)] ring-1 ring-white/15",
                    "transition-shadow duration-300 hover:shadow-[0_18px_44px_-10px_rgba(196,30,58,0.65)]",
                    "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
                  )}
                >
                  {!reduceMotion && !loading && (
                    <motion.span
                      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    />
                  )}
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Yoxlanılır...
                    </>
                  ) : (
                    <>
                      Daxil ol
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <motion.p
              className="mt-8 text-center text-sm text-zinc-500"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.35, duration: dur }}
            >
              Hesabınız yoxdur?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#f87171] underline-offset-4 transition-colors hover:text-rose-300 hover:underline"
              >
                Qeydiyyatdan keçin
              </Link>
            </motion.p>
          </div>
        </motion.div>

        <motion.p
          className="mt-6 text-center text-xs text-zinc-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.45 }}
        >
          Admin paneli üçün{" "}
          <Link href="/admin/login" className="text-zinc-400 underline-offset-2 hover:text-zinc-300 hover:underline">
            admin girişi
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
