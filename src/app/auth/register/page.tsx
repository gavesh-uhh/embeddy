"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  updateProfile,
} from "@/lib/firebase";
import {
  Cpu, Mail, Lock, User, ArrowRight, Loader2, ShieldAlert, CheckCircle2, Eye, EyeOff,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthColor = ["", "var(--accent-red)", "var(--accent-yellow)", "var(--accent)"][strength];

  const handleGoogle = async () => {
    setGoogleLoad(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
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
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      router.push("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/email-already-in-use") {
        setError("That email is already registered. Try signing in instead.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError("Registration failed. Check your Firebase config in .env.local.");
      }
      setLoading(false);
    }
  };

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

  return (
    <div className="fade-up">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center hero-icon"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          <Cpu size={18} strokeWidth={2.5} />
        </div>
        <span
          className="font-bold text-2xl tracking-tight"
          style={{ fontFamily: "Outfit, sans-serif", color: "var(--text-primary)" }}
        >
          Embeddy
        </span>
      </div>

      <div
        className="rounded-2xl border p-8"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border-bright)",
          boxShadow: "0 0 60px rgba(0,255,102,0.04)",
        }}
      >
        <div className="mb-6">
          <h1
            className="text-xl font-bold mb-1"
            style={{ fontFamily: "Outfit, sans-serif", color: "var(--text-primary)" }}
          >
            Create your account
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Your projects will be synced to the cloud and available on any device
          </p>
        </div>

        <button
          id="register-google-btn"
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
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
            <label htmlFor="reg-name" className="panel-header block mb-1.5">Full Name</label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              <input id="reg-name" type="text" autoComplete="name" value={name}
                onChange={(e) => setName(e.target.value)} disabled={loading}
                placeholder="Full Name"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="panel-header block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              <input id="reg-email" type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={loading}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="panel-header block mb-1.5">Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              <input id="reg-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={loading}
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
                disabled={loading}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((lvl) => (
                    <div key={lvl} className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{ background: strength >= lvl ? strengthColor : "var(--border-bright)" }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-semibold" style={{ color: strengthColor }}>
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="reg-confirm" className="panel-header block mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              <input id="reg-confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading}
                placeholder="••••••••"
                className="w-full pl-9 pr-16 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors text-glow"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                disabled={loading}
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              {confirmPassword && password === confirmPassword && (
                <CheckCircle2 size={13} className="absolute right-9 top-1/2 -translate-y-1/2" style={{ color: "var(--accent)" }} />
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg p-3 text-xs flex items-start gap-2"
              style={{ background: "var(--accent-red-glow)", color: "var(--accent-red)", border: "1px solid #ff3b3b30" }}>
              <ShieldAlert size={13} className="shrink-0 mt-0.5" />{error}
            </div>
          )}

          <button id="register-submit-btn" type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all mt-2"
            style={{
              background: loading ? "var(--surface-raised)" : "var(--accent)",
              color: loading ? "var(--text-muted)" : "#000",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 0 24px var(--accent-glow-strong)",
            }}
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Creating account…</>
            ) : (
              <>Create Account <ArrowRight size={14} strokeWidth={2.5} /></>
            )}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold transition-colors" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </p>
      </div>

      <p className="text-center text-[10px] mt-4" style={{ color: "var(--text-dim)" }}>
        Powered by Gemini AI · Projects stored in Firebase
      </p>
    </div>
  );
}
