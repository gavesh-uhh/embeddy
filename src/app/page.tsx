"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseFile } from "@/lib/parsePDF";
import { saveProject } from "@/lib/projectStore";
import { ProjectData, BoardType } from "@/lib/types";

const BOARDS: BoardType[] = [
  "Arduino Uno",
  "Arduino Mega",
  "ESP32",
  "ESP32-S3",
  "STM32F103",
  "STM32F4",
];

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    board: "ESP32" as BoardType,
    description: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 2);
    setFiles(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files)
      .filter((f) => f.type === "application/pdf" || f.name.endsWith(".txt"))
      .slice(0, 2);
    setFiles(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse uploaded files client-side
      const fileContents = await Promise.all(files.map(parseFile));

      const res = await fetch("/api/project/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          board: form.board,
          description: form.description,
          fileContents,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create project");
      }

      const project: ProjectData = await res.json();
      saveProject(project);
      router.push(`/project/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--accent-orange)", color: "white" }}
          >
            E
          </div>
          <span className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
            Embeddy
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-xs"
            style={{ background: "var(--surface-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Beta
          </span>
        </div>
        <button
          id="new-project-header-btn"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{ background: "var(--accent-orange)", color: "white" }}
        >
          + New Project
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs"
            style={{ background: "#f9731615", color: "var(--accent-orange)", border: "1px solid #f9731630" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-orange)" }} />
            AI-Powered · Multi-Agent Pipeline · Real-Time Analysis
          </div>

          <h1
            className="font-bold mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "var(--text-primary)", lineHeight: 1.15, fontFamily: "Outfit, sans-serif" }}
          >
            Design embedded systems
            <span style={{ color: "var(--accent-orange)" }}> 10× faster</span>
          </h1>

          <p className="text-base mb-10 leading-relaxed mx-auto max-w-lg" style={{ color: "var(--text-muted)" }}>
            Describe your project. Embeddy&apos;s AI agents generate circuit schematics, pin diagrams,
            power budgets, BOM, and production-ready code — all in parallel.
          </p>

          <button
            id="hero-new-project-btn"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded font-semibold text-sm transition-all"
            style={{
              background: "var(--accent-orange)",
              color: "white",
              boxShadow: "0 0 24px rgba(249,115,22,0.3)",
            }}
          >
            Start a Project
            <span>→</span>
          </button>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl w-full">
          {[
            { icon: "⚡", label: "Circuit Schematic", desc: "Interactive Konva canvas with zoom & pan" },
            { icon: "📌", label: "Pin Diagram", desc: "Signal-typed connections for all components" },
            { icon: "💡", label: "Power Budget", desc: "Per-component current draw analysis" },
            { icon: "📦", label: "BOM + Sourcing", desc: "Estimated costs and availability ratings" },
            { icon: "🔒", label: "Safety Analysis", desc: "Fatal issues and voltage conflict detection" },
            { icon: "🔧", label: "Compatibility", desc: "Board + component compatibility checks" },
            { icon: "💻", label: "Code Skeleton", desc: "Syntax-highlighted, compilable starter code" },
            { icon: "🤖", label: "9 AI Agents", desc: "All running in parallel via Gemini 1.5 Flash" },
          ].map((f, i) => (
            <div key={i}
              className="p-4 rounded border text-left"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-xl mb-2">{f.icon}</div>
              <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{f.label}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && !loading && setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border overflow-hidden"
            style={{ background: "var(--surface-raised)", borderColor: "var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
          >
            {/* Modal header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                New Project
              </h2>
              {!loading && (
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded flex items-center justify-center text-lg transition-colors"
                  style={{ color: "var(--text-muted)", background: "transparent" }}
                >
                  ×
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="panel-header block mb-2">Project Title</label>
                <input
                  id="project-title-input"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Temperature Monitor with OLED"
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded text-sm outline-none transition-colors"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontFamily: "Outfit, sans-serif",
                  }}
                />
              </div>

              {/* Board */}
              <div>
                <label className="panel-header block mb-2">Target Board</label>
                <div className="grid grid-cols-3 gap-2">
                  {BOARDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      id={`board-btn-${b.replace(/\s+/g, "-").toLowerCase()}`}
                      onClick={() => setForm({ ...form, board: b })}
                      disabled={loading}
                      className="px-3 py-2 rounded text-xs font-medium transition-colors text-center"
                      style={{
                        border: `1px solid ${form.board === b ? "var(--accent-orange)" : "var(--border)"}`,
                        background: form.board === b ? "#f9731620" : "var(--surface)",
                        color: form.board === b ? "var(--accent-orange)" : "var(--text-muted)",
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="panel-header block mb-2">Project Description</label>
                <textarea
                  id="project-description-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your embedded system project — components, sensors, displays, motors, connectivity needs, etc."
                  disabled={loading}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded text-sm outline-none resize-none transition-colors"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontFamily: "Outfit, sans-serif",
                  }}
                />
              </div>

              {/* File upload */}
              <div>
                <label className="panel-header block mb-2">Supporting Documents (optional, max 2)</label>
                <div
                  className="relative rounded border-2 border-dashed p-4 text-center cursor-pointer transition-colors"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => !loading && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-upload-input"
                    accept=".pdf,.txt"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  {files.length > 0 ? (
                    <div className="space-y-1">
                      {files.map((f, i) => (
                        <div key={i} className="text-xs flex items-center justify-center gap-2" style={{ color: "var(--accent-green)" }}>
                          <span>📄</span> {f.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Drop PDF or TXT files here, or click to browse
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded p-3 text-sm" style={{ background: "#f8514920", color: "#f85149", border: "1px solid #f8514940" }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                id="create-project-submit-btn"
                disabled={loading}
                className="w-full py-3 rounded font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: loading ? "var(--surface-raised)" : "var(--accent-orange)",
                  color: loading ? "var(--text-muted)" : "white",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Running AI pipeline…
                  </>
                ) : (
                  "Generate Project →"
                )}
              </button>

              {loading && (
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  9 AI agents are analyzing your project in parallel. This takes 30–60 seconds.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
