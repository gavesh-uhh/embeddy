"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFile } from "@/lib/parsePDF";
import { saveProject, listProjects, deleteProject } from "@/lib/projectStore";
import { authedPostStream, NotSignedInError } from "@/lib/apiClient";
import {
  PIPELINE_STAGES,
  PipelineStageKey,
  PipelineStageStatus,
} from "@/lib/pipelineStages";
import GenerationOverlay from "@/components/GenerationOverlay";
import { ProjectData, BoardType } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  Zap,
  ShieldAlert,
  Wrench,
  Code2,
  Bot,
  PinIcon,
  ShoppingCart,
  ArrowRight,
  FileText,
  Loader2,
  Plus,
  ArrowLeft,
  Sparkles,
  X,
  Cloud,
  Trash2,
  ExternalLink,
  CloudOff,
  FolderOpen,
  LogOut,
  User,
} from "lucide-react";
import Image from "next/image";

const BOARDS: BoardType[] = [
  "Arduino Uno",
  "Arduino Mega",
  "ESP32",
  "ESP32-S3",
  "STM32F103",
  "STM32F4",
];

const FEATURE_DETAILS = [
  {
    id: "schematic",
    title: "Circuit Schematic",
    category: "hardware",
    icon: Zap,
    shortDesc: "Interactive Canvas & Real-time Routing",
    longDesc:
      "Embeddy generates high-fidelity circuit schematics drawn directly on an interactive Konva canvas. Pan, zoom, and click individual components to highlight connected power, ground, and data wiring networks.",
    badge: "Konva.js Engine",
    color: "var(--accent)",
  },
  {
    id: "pinout",
    title: "Pin Diagram",
    category: "hardware",
    icon: PinIcon,
    shortDesc: "Signal-Typed Hardware Pinouts",
    longDesc:
      "Get complete mappings of microcontroller pin connections. Signals are categorized (Analog, Digital, I2C, SPI, UART, Power) and color-coded with physical alignment diagrams.",
    badge: "Signal-Typed Map",
    color: "var(--accent-blue)",
  },

  {
    id: "power",
    title: "Power Budget",
    category: "diagnostics",
    icon: Zap,
    shortDesc: "Current Draw & Voltage Validation",
    longDesc:
      "Analyze system current loads dynamically. Embeddy features a 20-segment LED load visualizer, individual voltage rail breakdowns, and intelligent alerts if USB power limits (500mA) are exceeded.",
    badge: "LED Load Analyzer",
    color: "var(--accent-red)",
  },
  {
    id: "bom",
    title: "BOM & Sourcing",
    category: "diagnostics",
    icon: ShoppingCart,
    shortDesc: "Procurement & Cost Estimation",
    longDesc:
      "Instantly compile a Bill of Materials (BOM) including quantities, description details, standard unit pricing, and estimated total project cost in Rupees.",
    badge: "LKR Sourced Lists",
    color: "var(--accent)",
  },
  {
    id: "safety",
    title: "Safety Analysis",
    category: "diagnostics",
    icon: ShieldAlert,
    shortDesc: "Voltage Conflict & Fault Detections",
    longDesc:
      "Verify component safety automatically. Detects short circuits, severe logic mismatches, missing pull-ups, and highlights critical hardware faults in red alert logs.",
    badge: "Threat Scanner",
    color: "var(--accent-red)",
  },
  {
    id: "compatibility",
    title: "Compatibility Checks",
    category: "diagnostics",
    icon: Wrench,
    shortDesc: "Pin-to-Shield Hardware Verifications",
    longDesc:
      "Ensures selected components are electrically compatible with target boards. Checks interface types, voltage tolerances, and provides detailed logic level shifter resolutions.",
    badge: "Tolerance Checked",
    color: "var(--accent-yellow)",
  },
  {
    id: "code",
    title: "Code Skeleton",
    category: "software",
    icon: Code2,
    shortDesc: "Compilable Starter Firmware",
    longDesc:
      "Generates fully documented, ready-to-flash firmware templates. Automatically imports required libraries, defines hardware pin configurations, and sets up communication lines.",
    badge: "C++ / MicroPython",
    color: "#a855f7",
  },
  {
    id: "agents",
    title: "9 AI Agents",
    category: "software",
    icon: Bot,
    shortDesc: "Parallel Multi-Agent Generation",
    longDesc:
      "Embeddy orchestrates 9 specialized agents in parallel (BOM Agent, Pins Agent, Power Agent, etc.). Generations complete in under 30 seconds, delivering highly coherent plans.",
    badge: "Parallel Pipeline",
    color: "var(--accent)",
  },
];

const PRESETS: Array<{
  label: string;
  board: BoardType;
  title: string;
  description: string;
}> = [
  {
    label: "Basic",
    board: "Arduino Uno",
    title: "LED Blink",
    description:
      "A minimal Arduino Uno project. Blink an LED connected to digital pin 13 through a 220Ω current-limiting resistor to a GND pin.",
  },
  {
    label: "Basic",
    board: "Arduino Uno",
    title: "Temperature Monitor",
    description:
      "An Arduino Uno temperature monitor. Read ambient temperature from a DHT11 sensor on digital pin 2, and print the reading to the Serial monitor every 2 seconds.",
  },
  {
    label: "Medium",
    board: "ESP32",
    title: "IoT Weather Station",
    description:
      "An ESP32 weather station. Read temperature and humidity from a DHT22 sensor on GPIO 4, display live readings on an SSD1306 I2C OLED at address 0x3C using SDA on GPIO 21 and SCL on GPIO 22, and publish the measurements to Wi-Fi over MQTT every 60 seconds.",
  },
];

const inputStyle: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border-bright)",
  color: "var(--text-primary)",
  fontFamily: "Outfit, sans-serif",
};

export default function Home() {
  const router = useRouter();

  const { user, loading: authLoading, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stages, setStages] = useState<Record<string, PipelineStageStatus>>(
    () => Object.fromEntries(PIPELINE_STAGES.map((s) => [s.key, "pending"])),
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedFeatureTab, setSelectedFeatureTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);

  const [myProjects, setMyProjects] = useState<ProjectData[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<"ok" | "offline" | "loading">("loading");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    board: "ESP32" as BoardType,
    description: "",
  });

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { migrateLocalStorageToFirestore } = await import("@/lib/migrateLocalStorage");
        await migrateLocalStorageToFirestore();
      } catch {}

      try {
        const { projects, source } = await listProjects();
        if (!cancelled) {
          setMyProjects(projects);
          setCloudStatus(source === "cloud" ? "ok" : "offline");
        }
      } catch {
        if (!cancelled) setCloudStatus("offline");
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const cloudDeleted = await deleteProject(id);
      if (cloudDeleted) {
        setMyProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  const filterValidFiles = (incoming: File[]) =>
    incoming
      .filter(
        (f) => f.type === "application/pdf" || f.name.endsWith(".pdf") || f.name.endsWith(".txt"),
      )
      .filter((f) => f.size <= 2 * 1024 * 1024) // 2MB limit
      .slice(0, 2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(filterValidFiles(Array.from(e.target.files || [])));
    e.target.value = "";
  };

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setLoading(true);
    setError(null);
    setStages(
      Object.fromEntries(PIPELINE_STAGES.map((s) => [s.key, "pending"])),
    );
    try {
      const fileContents = await Promise.all(files.map(parseFile));

      let project: ProjectData | null = null;
      let streamError: string | null = null;

      await authedPostStream(
        "/api/project/create",
        {
          title: form.title,
          board: form.board,
          description: form.description,
          fileContents,
        },
        {
          signal: AbortSignal.timeout(180_000),
          onEvent: (raw) => {
            const evt = raw as
              | {
                  type: "stage";
                  key: PipelineStageKey;
                  status: PipelineStageStatus;
                }
              | { type: "result"; project: ProjectData }
              | { type: "error"; error: string };

            if (evt.type === "stage") {
              setStages((prev) => ({ ...prev, [evt.key]: evt.status }));
            } else if (evt.type === "result") {
              project = evt.project;
            } else if (evt.type === "error") {
              streamError = evt.error;
            }
          },
        },
      );

      if (streamError) throw new Error(streamError);
      if (!project) throw new Error("The pipeline finished without a result.");
      const finished: ProjectData = project;

      await saveProject(finished);
      router.push(`/project/${finished.id}`);
    } catch (err) {
      if (err instanceof NotSignedInError) {
        setError("Please sign in to create projects.");
      } else if ((err as Error).name === "TimeoutError") {
        setError("The AI agents took too long. Please try again.");
      } else if ((err as Error).name === "AbortError") {
        setError("Request was cancelled. Please try again.");
      } else {
        setError((err as Error).message || "Failed to create project");
      }
      setLoading(false);
      setStages(
        Object.fromEntries(PIPELINE_STAGES.map((s) => [s.key, "pending"])),
      );
    }
  };

if (showForm) {
    return (
      <div
        className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex-1 overflow-y-auto lg:h-full">
          <div className="min-h-full flex items-center justify-center px-5 py-10">
            <div className="w-full max-w-lg min-w-0">
              <button
                onClick={() => setShowForm(false)}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors disabled:opacity-40"
                style={{ color: "var(--text-muted)" }}
              >
                <ArrowLeft size={13} /> Back
              </button>

              <h1
                className="text-2xl font-semibold tracking-tight mb-8"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                New Project
              </h1>

              <form onSubmit={handleSubmit} className="space-y-7">
                <div>
                  <span className="panel-header block mb-3">Start from a preset</span>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((preset) => {
                      const active =
                        form.title === preset.title &&
                        form.board === preset.board &&
                        form.description === preset.description;

                      return (
                        <button
                          key={preset.title}
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            setForm({
                              title: preset.title,
                              board: preset.board,
                              description: preset.description,
                            })
                          }
                          className="group rounded-xl px-3 py-3 text-left transition-colors min-w-0"
                          style={{
                            border: `1px solid ${active ? "#00ff6650" : "var(--border-bright)"}`,
                            background: active ? "#00ff660a" : "var(--surface-raised)",
                          }}
                        >
                          <span
                            className="block text-[10px] font-medium tracking-wide uppercase mb-1.5"
                            style={{ color: active ? "var(--accent)" : "var(--text-dim)" }}
                          >
                            {preset.label}
                          </span>
                          <span
                            className="block text-xs leading-snug break-words"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {preset.title}
                          </span>
                          <span
                            className="block text-[10px] mt-1 break-words"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {preset.board}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="project-title-input" className="panel-header block mb-1.5">
                    Title
                  </label>
                  <input
                    id="project-title-input"
                    type="text"
                    spellCheck={false}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Temperature Monitor with OLED"
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#00ff6650")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-bright)")}
                  />
                </div>

                <div>
                  <label className="panel-header block mb-3">Target Board</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BOARDS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        id={`board-btn-${b.replace(/\s+/g, "-").toLowerCase()}`}
                        onClick={() => setForm({ ...form, board: b })}
                        disabled={loading}
                        className="px-2 py-2.5 rounded-lg text-[11px] font-medium transition-colors"
                        style={{
                          border: `1px solid ${form.board === b ? "#00ff6650" : "var(--border-bright)"}`,
                          background: form.board === b ? "#00ff6612" : "var(--surface-raised)",
                          color: form.board === b ? "var(--accent)" : "var(--text-muted)",
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="project-description-input" className="panel-header block mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="project-description-input"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Components, sensors, displays, motors, connectivity…"
                    disabled={loading}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none transition-colors leading-relaxed"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#00ff6650")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-bright)")}
                  />
                </div>

                <div>
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
                    <div className="flex flex-wrap gap-1.5">
                      {files.map((f, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFiles(files.filter((_, j) => j !== i))}
                          disabled={loading}
                          title={f.name}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] max-w-full min-w-0"
                          style={{
                            background: "#00ff6610",
                            border: "1px solid #00ff6625",
                            color: "var(--accent)",
                          }}
                        >
                          <FileText size={11} className="flex-shrink-0" />
                          <span className="truncate">{f.name}</span>
                          <X size={11} className="flex-shrink-0" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 rounded-md text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        + Add
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="w-full py-2 rounded-lg text-[11px] transition-colors"
                      style={{
                        border: "1px dashed var(--border-bright)",
                        color: "var(--text-muted)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      Attach data sheets (PDF / TXT, max 2)
                    </button>
                  )}
                </div>

                {error && (
                  <div
                    className="rounded-lg p-2.5 text-xs flex items-center gap-2"
                    style={{
                      background: "var(--accent-red-glow)",
                      color: "var(--accent-red)",
                      border: "1px solid #ff3b3b30",
                    }}
                  >
                    <ShieldAlert size={13} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  id="create-project-submit-btn"
                  disabled={loading}
                  className="btn-accent w-full py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                >
                  Generate <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {loading && (
          <GenerationOverlay
            title={form.title || "Untitled project"}
            board={form.board}
            stages={stages}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <nav
        className="flex-shrink-0 flex items-center justify-between px-6 sm:px-8 py-3 border-b gap-4"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg border border-[#00ff6630] bg-[#050505] flex items-center justify-center p-0.5 flex-shrink-0">
            <Image
              src="/icon.png"
              alt="Embeddy"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <span
            className="font-semibold text-sm tracking-tight truncate"
            style={{
              fontFamily: "Outfit, sans-serif",
              color: "var(--text-primary)",
            }}
          >
            Embeddy
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => router.push("/pricing")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors mr-1"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <Sparkles size={12} style={{ color: "var(--accent)" }} />
            Pricing
          </button>
          {user ? (
            <>
              <button
                id="new-project-header-btn"
                onClick={() => setShowForm(true)}
                className="btn-accent flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
                style={{ color: "#000" }}
              >
                <Plus size={12} strokeWidth={3} />
                New Project
              </button>

              <div className="relative">
                <button
                  id="user-avatar-btn"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: "var(--accent)",
                    color: "#000",
                    boxShadow: userMenuOpen ? "0 0 0 2px #00ff6650" : "none",
                  }}
                  title={user.email ?? ""}
                >
                  {initials}
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div
                      className="absolute right-0 top-10 z-50 rounded-xl border p-2 min-w-52"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border-bright)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,255,102,0.04)",
                      }}
                    >
                      <div
                        className="px-3 py-2.5 mb-1 border-b"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              background: "var(--accent)",
                              color: "#000",
                            }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            {user.displayName && (
                              <p
                                className="text-xs font-semibold truncate"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {user.displayName}
                              </p>
                            )}
                            <p
                              className="text-[10px] truncate"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setShowForm(true);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        <Plus size={13} /> New Project
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-red)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        <LogOut size={13} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <button
              id="nav-signin-btn"
              onClick={() => router.push("/auth/login")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                border: "1px solid var(--border-bright)",
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#00ff6650";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-bright)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
            >
              <User size={12} />
              Sign In
            </button>
          )}
        </div>
      </nav>

      <main
        className="flex-1 grid grid-cols-1 lg:grid-cols-2 border-b min-h-0 lg:overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16 lg:py-0 lg:h-full lg:overflow-y-auto min-w-0">
          <h1
            className="mb-6 break-words"
            style={{
              fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
            }}
          >
            Embeddy
          </h1>

          <p
            className="text-[15px] leading-relaxed mb-9 max-w-md break-words"
            style={{ color: "var(--text-muted)" }}
          >
            Describe your project in plain language. Nine AI agents generate the circuit
            schematic, pin map, power budget, bill of materials, and firmware &mdash; all in
            parallel.
          </p>

          <div className="flex items-center gap-3">
            <button
              id="hero-new-project-btn"
              onClick={() => (user ? setShowForm(true) : router.push("/auth/login"))}
              className="btn-accent flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm"
              style={{ color: "#000" }}
            >
              {user ? "Start a Project" : "Get Started"}
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setShowFeaturesModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--border-bright)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              See features
            </button>
          </div>

          <div
            className="flex items-center gap-10 mt-12 pt-8 flex-wrap"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {[
              { value: `${PIPELINE_STAGES.length + 1}`, label: "AI agents" },
              { value: "~30s", label: "Full analysis" },
              { value: "6", label: "Board types" },
            ].map((s, i) => (
              <div key={i}>
                <div
                  className="text-2xl font-semibold"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {s.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex items-center justify-center p-6 sm:p-10 lg:p-16 relative lg:h-full lg:overflow-hidden border-t lg:border-t-0 lg:border-l w-full min-w-0"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
        >
          {authLoading ? (
            <div className="w-full max-w-lg rounded-2xl border h-[300px] flex flex-col items-center justify-center gap-3"
              style={{ borderColor: "var(--border)" }}
            >
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Syncing your projects
              </p>
            </div>
          ) : !user || myProjects.length === 0 ? (
            <div className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                border: "1px solid var(--border-bright)",
                background: "#050505",
              }}
            >
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Circuit schematic
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    color: "var(--text-dim)",
                  }}
                >
                  Preview
                </span>
              </div>

              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                <Image
                  src="/circuit_schematic.png"
                  alt="Circuit Schematic preview"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div
              className="w-full max-w-lg rounded-2xl border px-6 py-6 min-w-0"
              style={{
                borderColor: "var(--border-bright)",
                background: "#050505",
              }}
            >
              <div
                className="flex items-center justify-between mb-5 pb-4 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen size={14} style={{ color: "var(--accent)" }} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}
                  >
                    My Projects
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {cloudStatus === "loading" && (
                    <>
                      <Loader2
                        size={11}
                        className="animate-spin"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        Syncing
                      </span>
                    </>
                  )}
                  {cloudStatus === "ok" && (
                    <>
                      <Cloud size={11} style={{ color: "var(--accent)" }} />
                      <span className="text-[10px]" style={{ color: "var(--accent)" }}>
                        Synced
                      </span>
                    </>
                  )}
                  {cloudStatus === "offline" && (
                    <>
                      <CloudOff size={11} style={{ color: "var(--text-muted)" }} />
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        Offline
                      </span>
                    </>
                  )}
                </div>
              </div>

              {projectsLoading ? (
                <div
                  className="flex items-center gap-2 py-8 justify-center"
                  style={{ color: "var(--text-dim)" }}
                >
                  <Loader2 size={15} className="animate-spin" />
                  <span className="text-xs">Loading cloud projects…</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto overflow-x-hidden pr-1">
                  {myProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3.5 transition-colors min-w-0"
                      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#00ff6626")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {p.title}
                        </p>
                        <p
                          className="text-[11px] mt-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {p.board} ·{" "}
                          {new Date(p.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <button
                          onClick={() => router.push(`/project/${p.id}`)}
                          title="Open project"
                          aria-label={`Open project ${p.title}`}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                          <ExternalLink size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          title="Delete project"
                          aria-label={`Delete project ${p.title}`}
                          disabled={deletingId === p.id}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-red)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                          {deletingId === p.id ? (
                            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 size={13} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer
        className="py-4 text-center text-[11px]"
        style={{
          color: "var(--text-dim)",
          borderTop: "1px solid var(--border)",
        }}
      >
        Powered by Gemini AI
      </footer>

      {showFeaturesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6"
          style={{
            background: "rgba(3,3,3,0.8)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="flex flex-col w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-4xl sm:rounded-2xl border-0 sm:border overflow-hidden"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-bright)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div
              className="flex-shrink-0 px-8 py-6 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles size={15} style={{ color: "var(--accent)" }} />
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  Features
                </span>
              </div>
              <button
                onClick={() => {
                  setShowFeaturesModal(false);
                  setActiveFeatureId(null);
                }}
                aria-label="Close features"
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <X size={16} />
              </button>
            </div>

            <div
              className="flex-shrink-0 px-8 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All" },
                  { id: "hardware", label: "Hardware" },
                  { id: "software", label: "Software" },
                  { id: "diagnostics", label: "Diagnostics" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedFeatureTab(tab.id);
                      setActiveFeatureId(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: selectedFeatureTab === tab.id ? "#00ff6610" : "transparent",
                      color: selectedFeatureTab === tab.id ? "var(--accent)" : "var(--text-muted)",
                      border: `1px solid ${selectedFeatureTab === tab.id ? "#00ff6626" : "transparent"}`,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search features"
                aria-label="Search features"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveFeatureId(null);
                }}
                className="px-3 py-2 rounded-lg text-xs outline-none w-full md:w-52 border transition-colors"
                style={{
                  background: "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                {(() => {
                  const filtered = FEATURE_DETAILS.filter((f) => {
                    const matchesTab =
                      selectedFeatureTab === "all" || f.category === selectedFeatureTab;
                    const matchesSearch =
                      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      f.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      f.longDesc.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesTab && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div
                        className="col-span-2 py-16 text-center text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No features match &ldquo;{searchQuery}&rdquo;
                      </div>
                    );
                  }

                  return filtered.map((f) => {
                    const Icon = f.icon;
                    const isActive = activeFeatureId === f.id;

                    return (
                      <div
                        key={f.id}
                        onClick={() => setActiveFeatureId(isActive ? null : f.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveFeatureId(isActive ? null : f.id);
                          }
                        }}
                        aria-expanded={isActive}
                        className="rounded-xl p-5 cursor-pointer transition-colors min-w-0 break-words"
                        style={{
                          background: isActive ? "#00ff6606" : "var(--bg)",
                          border: `1px solid ${isActive ? "#00ff6630" : "var(--border)"}`,
                        }}
                      >
                        <div className="flex items-center gap-2.5 mb-3 min-w-0">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "var(--surface-raised)", color: f.color }}
                          >
                            <Icon size={13} strokeWidth={2} />
                          </span>
                          <h4
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {f.title}
                          </h4>
                        </div>

                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {isActive ? f.longDesc : f.shortDesc}
                        </p>

                        {isActive && (
                          <div
                            className="mt-4 pt-4 border-t"
                            style={{ borderColor: "var(--border)" }}
                          >
                            {f.id === "schematic" && (
                              <div
                                className="p-2.5 rounded bg-black/40 border border-white/5 font-mono text-[9px]"
                                style={{
                                  color: "var(--text-muted)",
                                  borderColor: "var(--border)",
                                }}
                              >
                                <div className="text-[var(--accent)]">
                                  {"// Dynamic routing initialization"}
                                </div>
                                <div>$ renderer.stage.zoom(1.2);</div>
                                <div>$ connectionGroup.highlight(&quot;comp_ESP32&quot;);</div>
                              </div>
                            )}

                            {f.id === "power" && (
                              <div
                                className="p-2.5 rounded bg-black/40 border border-white/5 space-y-1.5"
                                style={{ borderColor: "var(--border)" }}
                              >
                                <div
                                  className="flex justify-between text-[9px] font-mono"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  <span>SIMULATED_LOAD</span>
                                  <span>320mA / 500mA</span>
                                </div>
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 15 }).map((_, idx) => (
                                    <div
                                      key={idx}
                                      className="h-1.5 flex-1 rounded-sm"
                                      style={{
                                        background:
                                          idx < 10 ? "var(--accent)" : "rgba(255,255,255,0.05)",
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {f.id === "compatibility" && (
                              <div
                                className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[9px] font-mono"
                                style={{ borderColor: "var(--border)" }}
                              >
                                <span style={{ color: "var(--accent)" }}>
                                  ✓ I2C Bus Tolerances verified
                                </span>
                                <span style={{ color: "var(--text-muted)" }}>3.3V Logic</span>
                              </div>
                            )}
                            {f.id === "bom" && (
                              <div
                                className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[9px] font-mono"
                                style={{
                                  borderColor: "var(--border)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                <span>Est. Cost: Rs. 1,450.00</span>
                                <span>4 Lines</span>
                              </div>
                            )}
                            {f.id === "safety" && (
                              <div
                                className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[9px] font-mono text-[var(--accent)]"
                                style={{ borderColor: "var(--border)" }}
                              >
                                <span>✓ No voltage conflicts compiled</span>
                              </div>
                            )}
                            {f.id === "code" && (
                              <div
                                className="p-2.5 rounded bg-black/40 border border-white/5 font-mono text-[9px]"
                                style={{
                                  color: "var(--text-muted)",
                                  borderColor: "var(--border)",
                                }}
                              >
                                <div className="text-purple-400">#include &lt;Wire.h&gt;</div>
                                <div>void setup() &#123; Wire.begin(); &#125;</div>
                              </div>
                            )}
                            {f.id === "agents" && (
                              <div
                                className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[9px] font-mono"
                                style={{
                                  borderColor: "var(--border)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                <span>9 Pipelines compiling…</span>
                                <span style={{ color: "var(--accent)" }}>READY in 28.4s</span>
                              </div>
                            )}
                            {f.id === "pinout" && (
                              <div
                                className="p-2 rounded bg-black/40 border border-white/5 flex gap-1.5 flex-wrap"
                                style={{ borderColor: "var(--border)" }}
                              >
                                {["GPIO21", "GPIO22", "3V3", "GND"].map((p, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1 py-0.5 rounded text-[8px] font-mono bg-white/5"
                                    style={{
                                      color:
                                        idx === 2
                                          ? "var(--accent-red)"
                                          : idx === 3
                                            ? "var(--text-muted)"
                                            : "var(--accent)",
                                    }}
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div
              className="flex-shrink-0 px-8 py-5 border-t flex items-center justify-end"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                onClick={() => {
                  setShowFeaturesModal(false);
                  setActiveFeatureId(null);
                }}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold"
                style={{
                  background: "var(--accent)",
                  color: "#000",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
