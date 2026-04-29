"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Megaphone,
  Palette,
} from "lucide-react";
import authApi from "@/lib/authApi";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

const fieldClass = cn(
  "w-full rounded-xl border border-white/10 bg-white/[0.06] py-3.5 pl-12 pr-4 text-[15px] text-white",
  "placeholder:text-zinc-500 outline-none transition-[border-color,box-shadow,background] duration-200",
  "focus:border-[#C41E3A]/50 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(196,30,58,0.2)]",
  "disabled:cursor-not-allowed disabled:opacity-55"
);

export default function RegisterPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"REKLAMCI" | "DECORCU">("DECORCU");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dur = reduceMotion ? 0.01 : 0.55;
  const spring = reduceMotion ? { duration: 0.01 } : { type: "spring" as const, stiffness: 380, damping: 28 };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authApi.register({ ...form, accountType });
      authApi.saveCurrentUser(result);
      if (result.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Qeydiyyat alınmadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#070a12] text-zinc-100 flex items-center justify-center px-4 py-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-1/4 top-0 h-[min(90vw,520px)] w-[min(90vw,520px)] rounded-full bg-[#C41E3A]/22 blur-[100px]"
          animate={
            reduceMotion
              ? {}
              : { x: [0, 36, 0], y: [0, 20, 0], scale: [1, 1.05, 1] }
          }
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-1/4 bottom-0 h-[min(80vw,460px)] w-[min(80vw,460px)] rounded-full bg-amber-500/12 blur-[100px]"
          animate={
            reduceMotion
              ? {}
              : { x: [0, -32, 0], y: [0, -18, 0] }
          }
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
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
          className={cn(
            "relative overflow-hidden rounded-[1.75rem] border border-white/[0.12]",
            "bg-zinc-900/55 shadow-[0_32px_64px_-16px_rgba(0,0,0,.55),inset_0_1px_0_0_rgba(255,255,255,.06)]",
            "backdrop-blur-2xl"
          )}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="px-8 py-9 md:px-10 md:py-10">
            <motion.div
              className="mb-7 text-center"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: reduceMotion ? 0 : 0.04 }}
            >
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C41E3A] to-[#7f1d1d] shadow-[0_12px_40px_-8px_rgba(196,30,58,0.6)] ring-1 ring-white/20"
                whileHover={reduceMotion ? {} : { scale: 1.04, rotate: 2 }}
                whileTap={reduceMotion ? {} : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <User className="h-8 w-8 text-white" strokeWidth={1.75} />
              </motion.div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-[1.65rem]">
                Qeydiyyat
              </h1>
              <p className="mt-2 text-sm text-zinc-400">Premium Reklam hesabı yaradın</p>
            </motion.div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Hesab növü
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setAccountType("REKLAMCI")}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-colors",
                      accountType === "REKLAMCI"
                        ? "border-[#C41E3A]/70 bg-[#C41E3A]/20 shadow-[0_0_0_3px_rgba(196,30,58,0.2)]"
                        : "border-white/10 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.06]"
                    )}
                  >
                    <Megaphone
                      className={cn(
                        "h-6 w-6",
                        accountType === "REKLAMCI" ? "text-rose-200" : "text-zinc-500"
                      )}
                      aria-hidden
                    />
                    <span className={cn("text-sm font-semibold", accountType === "REKLAMCI" ? "text-white" : "text-zinc-300")}>
                      Reklamçı
                    </span>
                    <span className="text-[11px] leading-tight text-zinc-500">Reklam və çap sifarişləri</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setAccountType("DECORCU")}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-colors",
                      accountType === "DECORCU"
                        ? "border-[#C41E3A]/70 bg-[#C41E3A]/20 shadow-[0_0_0_3px_rgba(196,30,58,0.2)]"
                        : "border-white/10 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.06]"
                    )}
                  >
                    <Palette
                      className={cn(
                        "h-6 w-6",
                        accountType === "DECORCU" ? "text-rose-200" : "text-zinc-500"
                      )}
                      aria-hidden
                    />
                    <span className={cn("text-sm font-semibold", accountType === "DECORCU" ? "text-white" : "text-zinc-300")}>
                      Dekorçu
                    </span>
                    <span className="text-[11px] leading-tight text-zinc-500">Dekor və montaj tərəfdaşı</span>
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div
                    key={error}
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: reduceMotion ? 0.01 : 0.26, ease: easeOut }}
                    className="overflow-hidden rounded-xl border border-red-500/35 bg-red-950/50 px-4 py-3 text-sm text-red-200"
                  >
                    {error}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {[
                {
                  name: "fullName" as const,
                  label: "Ad Soyad",
                  placeholder: "Adınız və soyadınız",
                  icon: <User className="h-5 w-5" />,
                  type: "text" as const,
                  required: true,
                  delay: 0.08,
                  padLeft: "pl-12",
                },
                {
                  name: "username" as const,
                  label: "İstifadəçi adı",
                  placeholder: "istifadeci_adi",
                  icon: <span className="text-sm font-semibold text-zinc-400">@</span>,
                  type: "text" as const,
                  required: true,
                  delay: 0.11,
                  padLeft: "pl-12",
                },
                {
                  name: "email" as const,
                  label: "Email",
                  placeholder: "email@ornek.com",
                  icon: <Mail className="h-5 w-5" />,
                  type: "email" as const,
                  required: true,
                  delay: 0.14,
                  padLeft: "pl-12",
                },
                {
                  name: "phone" as const,
                  label: "Telefon",
                  placeholder: "+994 50 123 45 67",
                  icon: <Phone className="h-5 w-5" />,
                  type: "text" as const,
                  required: false,
                  delay: 0.17,
                  padLeft: "pl-12",
                },
              ].map((field) => (
                <motion.div
                  key={field.name}
                  initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring, delay: reduceMotion ? 0 : field.delay }}
                >
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {field.label}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                      {field.icon}
                    </div>
                    <input
                      name={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      disabled={loading}
                      className={fieldClass}
                    />
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.2 }}
              >
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Şifrə
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 simvol"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    disabled={loading}
                    className={cn(fieldClass, "pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
                    aria-label={showPassword ? "Gizlət" : "Göstər"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.24 }}
                className="pt-1"
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
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  {!reduceMotion && !loading && (
                    <motion.span
                      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/18 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.8, ease: "easeInOut" }}
                    />
                  )}
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Göndərilir...
                    </>
                  ) : (
                    <>
                      Qeydiyyatdan keç
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>

              <p className="pt-2 text-center text-sm text-zinc-500">
                Artıq hesabınız var?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#f87171] underline-offset-4 hover:text-rose-300 hover:underline"
                >
                  Daxil olun
                </Link>
              </p>
            </form>
          </div>
        </motion.div>

        <motion.p
          className="mt-6 text-center text-xs text-zinc-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.35 }}
        >
          Qeydiyyatla razılaşıram{" "}
          <Link href="/terms" className="text-zinc-400 hover:text-zinc-300 hover:underline">
            İstifadə şərtləri
          </Link>{" "}
          və{" "}
          <Link href="/privacy" className="text-zinc-400 hover:text-zinc-300 hover:underline">
            Məxfilik siyasəti
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
