"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
} from "@/lib/firebase";
import { Mail, Lock, ArrowRight, Loader2, ShieldAlert, Eye, EyeOff } from "lucide-react";

const inputStyle = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border-bright)",
  color: "var(--text-primary)",
  fontFamily: "Outfit, sans-serif",
};
const onFocus = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.currentTarget.style.borderColor = "#00ff6650");
const onBlur = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.currentTarget.style.borderColor = "var(--border-bright)");

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const nextUrl      = searchParams.get("next") || "/";

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [googleLoad,  setGoogleLoad]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleGoogle = async () => {
    setGoogleLoad(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push(nextUrl);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
      setGoogleLoad(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push(nextUrl);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Invalid email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Sign in failed. Check your Firebase config in .env.");
      }
      setLoading(false);
    }
  };

  return (
    <>
      <button
        id="login-google-btn"
        type="button"
        onClick={handleGoogle}
        disabled={googleLoad || loading}
        className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all mb-4"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-bright)",
          color: "var(--text-primary)",
          cursor: googleLoad || loading ? "not-allowed" : "pointer",
          opacity: googleLoad || loading ? 0.6 : 1,
        }}
        onMouseEnter={e => { if (!googleLoad && !loading) e.currentTarget.style.borderColor = "#00ff6650"; }}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-bright)")}
      >
        {googleLoad ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {googleLoad ? "Signing in…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: "var(--border-bright)" }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "var(--border-bright)" }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="panel-header block mb-1.5">Email Address</label>
          <div className="relative">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <input id="login-email" type="email" autoComplete="email" value={email}
              onChange={e => setEmail(e.target.value)} disabled={loading || googleLoad}
              placeholder="you@example.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="panel-header block mb-1.5">Password</label>
          <div className="relative">
            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password}
              onChange={e => setPassword(e.target.value)} disabled={loading || googleLoad}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors text-glow"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              disabled={loading || googleLoad}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg p-3 text-xs flex items-start gap-2"
            style={{ background: "var(--accent-red-glow)", color: "var(--accent-red)", border: "1px solid #ff3b3b30" }}>
            <ShieldAlert size={13} className="shrink-0 mt-0.5" />{error}
          </div>
        )}

        <button id="login-submit-btn" type="submit" disabled={loading || googleLoad}
          className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: loading ? "var(--surface-raised)" : "var(--accent)",
            color: loading ? "var(--text-muted)" : "#000",
            cursor: loading || googleLoad ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 0 24px var(--accent-glow-strong)",
          }}
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : <>Sign In <ArrowRight size={14} strokeWidth={2.5} /></>}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="fade-up">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <div className="w-9 h-9 rounded-xl border border-[#00ff6630] bg-[#050505] shadow-[0_0_15px_rgba(0,255,102,0.18)] flex items-center justify-center p-0.5">
          <img src="/icon.png" alt="Embeddy" className="w-full h-full object-contain" />
        </div>
        <span className="font-bold text-2xl tracking-tight" style={{ fontFamily: "Outfit, sans-serif", color: "var(--text-primary)" }}>
          Embeddy
        </span>
      </div>

      <div className="rounded-2xl border p-8"
        style={{ background: "var(--surface)", borderColor: "var(--border-bright)", boxShadow: "0 0 60px rgba(0,255,102,0.04)" }}>
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif", color: "var(--text-primary)" }}>
            Welcome back
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Sign in to access your cloud-synced projects
          </p>
        </div>

        <Suspense fallback={<div className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>Loading…</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-semibold" style={{ color: "var(--accent)" }}>
            Create one
          </Link>
        </p>
      </div>

      <p className="text-center text-[10px] mt-4" style={{ color: "var(--text-dim)" }}>
        Powered by Gemini AI · Projects stored in Firebase
      </p>
    </div>
  );
}
