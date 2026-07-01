"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFile } from "@/lib/parsePDF";
import { saveProject, listProjects, deleteProject } from "@/lib/projectStore";
import { ProjectData, BoardType } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  Cpu,
  Zap,
  ShieldAlert,
  Wrench,
  Code2,
  Bot,
  PinIcon,
  ShoppingCart,
  ArrowRight,
  Upload,
  FileText,
  Loader2,
  Plus,
  ArrowLeft,
  Sparkles,
  BookOpen,
  HelpCircle,
  X,
  Cloud,
  Trash2,
  ExternalLink,
  CloudOff,
  FolderOpen,
  LogOut,
  User,
  Layers,
} from "lucide-react";

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
    id: "pcb",
    title: "PCB Layout",
    category: "hardware",
    icon: Layers,
    shortDesc: "Auto-Generated Board Layout & Routing",
    longDesc:
      "Auto-generate component placement and double-sided routing. Export netlists and production-ready designs for custom physical microcontrollers.",
    badge: "BETA",
    color: "var(--accent)",
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
    title: "10 AI Agents",
    category: "software",
    icon: Bot,
    shortDesc: "Parallel Multi-Agent Generation",
    longDesc:
      "Embeddy orchestrates 10 specialized agents in parallel (BOM Agent, Pins Agent, Power Agent, PCB Layout Agent, etc.). Generations complete in under 30 seconds, delivering highly coherent plans.",
    badge: "Parallel Pipeline",
    color: "var(--accent)",
  },
];



const EXAMPLES: Array<{
  title: string;
  board: BoardType;
  description: string;
  generatePCB?: boolean;
}> = [
  {
    title: "IoT Weather Monitor",
    board: "ESP32",
    description:
      "An ESP32-based weather station. Reads temperature and humidity from a DHT22 sensor, displays the data on an I2C OLED (SSD1306) screen, and transmits measurements over Wi-Fi.",
    generatePCB: true,
  },
  {
    title: "Automatic Plant Watering",
    board: "Arduino Uno",
    description:
      "Arduino Uno system with a capacitive soil moisture sensor, a 5V relay driving a mini submersible water pump, and indicator LEDs showing status (soil wet/dry).",
    generatePCB: true,
  },
  {
    title: "4-Axis Robotic Arm Control",
    board: "STM32F4",
    description:
      "STM32F4 based 4-axis robotic arm controller. Uses four servo motors controlled via PWM, reading positions from dual analog joystick inputs and using UART for debugging.",
    generatePCB: true,
  },
];

export default function Home() {
  const router = useRouter();

  const { user, loading: authLoading, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedFeatureTab, setSelectedFeatureTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);

  const [myProjects, setMyProjects] = useState<ProjectData[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<"ok" | "offline" | "loading">(
    "loading",
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    board: "ESP32" as BoardType,
    description: "",
    generatePCB: false,
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
        const { migrateLocalStorageToFirestore } =
          await import("@/lib/migrateLocalStorage");
        await migrateLocalStorageToFirestore();
      } catch {}

      try {
        const projects = await listProjects();
        if (!cancelled) {
          setMyProjects(projects);
          setCloudStatus("ok");
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
    setDeletingId(id);
    try {
      await deleteProject(id);
      setMyProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

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

  const loadExample = (ex: (typeof EXAMPLES)[0]) => {
    setForm({
      title: ex.title,
      board: ex.board,
      description: ex.description,
      generatePCB: ex.generatePCB ?? false,
    });
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
      const fileContents = await Promise.all(files.map(parseFile));
      const res = await fetch("/api/project/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          board: form.board,
          description: form.description,
          fileContents,
          generatePCB: form.generatePCB,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create project");
      }
      const project: ProjectData = await res.json();
      await saveProject(project);
      router.push(`/project/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <div
        className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden"
        style={{ background: "var(--bg)" }}
      >
        <nav
          className="flex-shrink-0 flex items-center justify-between px-8 py-3.5 border-b"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!loading) setShowForm(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--border-bright)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              disabled={loading}
            >
              <ArrowLeft size={13} />
              Back
            </button>
            <span style={{ color: "var(--border)" }}>|</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border border-[#00ff6630] bg-[#050505] shadow-[0_0_10px_rgba(0,255,102,0.15)] flex items-center justify-center p-0.5">
                <img src="/icon.png" alt="Embeddy" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
                New Design Pipeline
              </span>
            </div>
          </div>
          <span
            className="text-xs px-2.5 py-0.5 rounded font-bold tracking-wider"
            style={{
              background: "#00ff6610",
              color: "var(--accent)",
              border: "1px solid #00ff6620",
            }}
          >
            AI DESIGN ENGINE ACTIVE
          </span>
        </nav>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:overflow-hidden">
          <div
            className="lg:col-span-7 p-6 sm:p-8 lg:p-12 overflow-y-auto lg:h-full flex flex-col justify-center border-b lg:border-b-0 lg:border-r"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="max-w-xl mx-auto w-full space-y-5">
              <div>
                <h1
                  className="text-2xl font-bold mb-1"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  Create New Project
                </h1>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Provide hardware details below to start the multi-agent design
                  generation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="panel-header block mb-1.5">
                    Project Title
                  </label>
                  <input
                    id="project-title-input"
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Temperature Monitor with OLED"
                    disabled={loading}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-bright)",
                      color: "var(--text-primary)",
                      fontFamily: "Outfit, sans-serif",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#00ff6650")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--border-bright)")
                    }
                  />
                </div>

                <div>
                  <label className="panel-header block mb-1.5">
                    Target Board
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BOARDS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        id={`board-btn-${b.replace(/\s+/g, "-").toLowerCase()}`}
                        onClick={() => setForm({ ...form, board: b })}
                        disabled={loading}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          border: `1px solid ${form.board === b ? "#00ff6650" : "var(--border-bright)"}`,
                          background:
                            form.board === b
                              ? "#00ff6612"
                              : "var(--surface-raised)",
                          color:
                            form.board === b
                              ? "var(--accent)"
                              : "var(--text-muted)",
                          boxShadow:
                            form.board === b
                              ? "0 0 12px rgba(0,255,102,0.1)"
                              : "none",
                        }}
                      >
                        <Cpu size={11} strokeWidth={2} />
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="panel-header block mb-1.5">
                    Project Description
                  </label>
                  <textarea
                    id="project-description-input"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe your embedded system project — components, sensors, displays, motors, connectivity needs, etc."
                    disabled={loading}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none transition-all"
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-bright)",
                      color: "var(--text-primary)",
                      fontFamily: "Outfit, sans-serif",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#00ff6650")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--border-bright)")
                    }
                  />
                </div>

                <div>
                  <label className="panel-header block mb-1.5">
                    Supporting Documents (optional, max 2)
                  </label>
                  <div
                    className="relative rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all"
                    style={{
                      borderColor: "var(--border-bright)",
                      background: "var(--surface-raised)",
                    }}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !loading && fileInputRef.current?.click()}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "#00ff6640")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--border-bright)")
                    }
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
                          <div
                            key={i}
                            className="text-xs flex items-center justify-center gap-2"
                            style={{ color: "var(--accent)" }}
                          >
                            <FileText size={12} /> {f.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload
                          size={16}
                          style={{ color: "var(--text-muted)" }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Upload component data sheets
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Supports PDF or TXT up to 2MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PCB Generation Option */}
                <div
                  className="flex items-center gap-3 px-3 py-3 rounded-lg border"
                  style={{
                    borderColor: form.generatePCB
                      ? "var(--accent)40"
                      : "var(--border)",
                    background: form.generatePCB
                      ? "var(--accent-green-glow)"
                      : "var(--surface-raised)",
                  }}
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="generate-pcb"
                      checked={form.generatePCB}
                      onChange={(e) =>
                        setForm({ ...form, generatePCB: e.target.checked })
                      }
                      disabled={loading}
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{
                        accentColor: "var(--accent-green)",
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="generate-pcb"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Layers
                        size={14}
                        style={{ color: "var(--accent-green)" }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Generate PCB Layout
                      </span>
                    </label>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Creates a basic PCB design with component placements and
                      auto-routed traces
                    </p>
                  </div>
                </div>

                {error && (
                  <div
                    className="rounded-lg p-3 text-xs flex items-center gap-2"
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
                  className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: loading
                      ? "var(--surface-raised)"
                      : "var(--accent)",
                    color: loading ? "var(--text-muted)" : "#000",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading
                      ? "none"
                      : "0 0 24px var(--accent-glow-strong)",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Running AI
                      Pipeline (30-60s)…
                    </>
                  ) : (
                    <>
                      Generate Project Infrastructure{" "}
                      <ArrowRight size={15} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div
            className="lg:col-span-5 p-6 sm:p-8 lg:p-12 lg:h-full flex flex-col justify-start space-y-6 lg:overflow-hidden"
            style={{ background: "var(--surface)" }}
          >
            <div className="space-y-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen size={16} style={{ color: "var(--accent)" }} />
                <h3
                  className="font-bold text-xs tracking-wide uppercase"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  Prompting Guide
                </h3>
              </div>
              <div
                className="rounded-xl border p-4 space-y-3.5"
                style={{ borderColor: "var(--border)", background: "#050505" }}
              >
                <div className="flex gap-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded h-fit font-bold"
                    style={{
                      background: "#00ff6615",
                      color: "var(--accent)",
                      border: "1px solid #00ff6625",
                    }}
                  >
                    1
                  </span>
                  <div>
                    <h4
                      className="text-xs font-semibold mb-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      State components clearly
                    </h4>
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Include parts like &quot;SSD1306 OLED screen&quot; or
                      &quot;DHT11 sensor&quot; so AI knows exactly what to
                      route.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded h-fit font-bold"
                    style={{
                      background: "#00ff6615",
                      color: "var(--accent)",
                      border: "1px solid #00ff6625",
                    }}
                  >
                    2
                  </span>
                  <div>
                    <h4
                      className="text-xs font-semibold mb-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Define logic thresholds
                    </h4>
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Operational guidelines: e.g. &quot;when moisture drops
                      below 30%, trigger relay.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} style={{ color: "var(--accent)" }} />
                  <h3
                    className="font-bold text-xs tracking-wide uppercase"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    Interactive Examples
                  </h3>
                </div>
                <div className="space-y-3">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => loadExample(ex)}
                      className="w-full p-3.5 rounded-xl border text-left transition-all hover:border-[#00ff6640] hover:bg-[#00ff6604]"
                      style={{
                        borderColor: "var(--border)",
                        background: "#050505",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-xs font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {ex.title}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 font-mono rounded"
                          style={{
                            background: "var(--surface-raised)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {ex.board}
                        </span>
                      </div>
                      <p
                        className="text-xs leading-normal line-clamp-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {ex.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="space-y-3.5 p-4 rounded-xl border text-xs"
                style={{
                  borderColor: "var(--border)",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <HelpCircle
                    size={13}
                    style={{ color: "var(--text-muted)" }}
                  />
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Which microcontroller?
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", lineHeight: "1.5" }}>
                  Choose **ESP32** for Wi-Fi/BT IoT. Choose **Arduino Uno** for
                  standard 5V logic shields and basics. Choose **STM32** for
                  advanced, high-performance industrial controller tasks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <nav
        className="flex-shrink-0 flex items-center justify-between px-8 py-3 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg border border-[#00ff6630] bg-[#050505] shadow-[0_0_12px_rgba(0,255,102,0.15)] flex items-center justify-center p-0.5">
            <img src="/icon.png" alt="Embeddy" className="w-full h-full object-contain" />
          </div>
          <span
            className="font-bold text-sm tracking-tight"
            style={{
              fontFamily: "Outfit, sans-serif",
              color: "var(--text-primary)",
            }}
          >
            Embeddy
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-bold"
            style={{
              background: "#00ff6610",
              color: "var(--accent)",
              border: "1px solid #00ff6620",
              letterSpacing: "0.08em",
            }}
          >
            BETA
          </span>
        </div>

        <div className="flex items-center gap-3">
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
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 top-10 z-50 rounded-xl border p-2 min-w-52"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border-bright)",
                        boxShadow:
                          "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,255,102,0.04)",
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
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--text-primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-muted)")
                        }
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
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--accent-red)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-muted)")
                        }
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

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 border-b min-h-0 lg:overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-0 fade-up lg:h-full lg:overflow-y-auto">
          <h1
            className="glitch-text font-bold mb-3"
            data-text="Embeddy"
            style={{
              fontSize: "clamp(3.5rem, 6vw, 6rem)",
              fontFamily: "Outfit, sans-serif",
              color: "var(--text-primary)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
            }}
          >
            Embeddy
          </h1>

          <p
            className="text-lg font-medium mb-2"
            style={{ color: "var(--accent)", fontFamily: "Outfit, sans-serif" }}
          >
            Design embedded systems 10× faster
          </p>

          <p
            className="text-sm leading-relaxed mb-6 max-w-md"
            style={{ color: "var(--text-muted)" }}
          >
            Describe your project. 9 AI agents generate circuit schematics, pin
            diagrams, power budgets, BOM, and production-ready code — all in
            parallel.
          </p>

          <div className="flex items-center gap-3">
            <button
              id="hero-new-project-btn"
              onClick={() =>
                user ? setShowForm(true) : router.push("/auth/login")
              }
              className="btn-accent flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm"
              style={{ color: "#000" }}
            >
              {user ? "Start a Project" : "Get Started"}
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setShowFeaturesModal(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
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
            className="flex items-center gap-6 mt-6 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {[
              { value: "9", label: "AI Agents" },
              { value: "~30s", label: "Full analysis" },
              { value: "6", label: "Board types" },
            ].map((s, i) => (
              <div key={i}>
                <div
                  className="text-xl font-bold"
                  style={{
                    color: "var(--accent)",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {s.value}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex items-center justify-center p-6 sm:p-10 relative overflow-hidden lg:h-full border-t lg:border-t-0 lg:border-l w-full lg:w-auto"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          {authLoading ? (
            <div
              className="w-full max-w-lg rounded-xl border p-8 flex flex-col items-center justify-center h-[280px]"
              style={{ borderColor: "var(--border)", background: "#050505" }}
            >
              <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
              <p className="text-xs mt-3 text-glow" style={{ color: "var(--text-muted)", fontFamily: "Outfit, sans-serif" }}>Synchronizing cloud session…</p>
            </div>
          ) : !user || myProjects.length === 0 ? (
            <div
              className="w-full max-w-lg rounded-xl overflow-hidden relative group"
              style={{ 
                border: "1px solid var(--border-bright)", 
                boxShadow: "0 0 50px rgba(0,255,102,0.05), inset 0 0 20px rgba(255,255,255,0.02)",
                background: "#050505"
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: "#0a0a0a", borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#333" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "#333" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "#333" }} />
                </div>
                <span className="text-[10px] tracking-widest font-mono uppercase" style={{ color: "var(--text-muted)" }}>
                  Circuit Visualizer
                </span>
                <div className="w-12 h-1.5 bg-[#111] rounded-full" />
              </div>

              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black p-4 flex items-center justify-center">
                <img 
                  src="/circuit_schematic.png" 
                  alt="Circuit Schematic preview" 
                  className="w-full h-full object-cover rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[rgba(0,255,102,0.03)]" />
              </div>
            </div>
          ) : (
            <div
              className="w-full max-w-lg rounded-xl border p-6 relative group"
              style={{ 
                borderColor: "var(--border-bright)", 
                boxShadow: "0 0 50px rgba(0,255,102,0.05), inset 0 0 20px rgba(255,255,255,0.01)",
                background: "#050505"
              }}
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <FolderOpen size={15} style={{ color: "var(--accent)" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}>
                    My Projects
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {cloudStatus === "loading" && (
                    <><Loader2 size={11} className="animate-spin" style={{ color: "var(--text-muted)" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Syncing…</span></>
                  )}
                  {cloudStatus === "ok" && (
                    <><Cloud size={11} style={{ color: "var(--accent)" }} />
                    <span className="text-[10px]" style={{ color: "var(--accent)" }}>Cloud Synced</span></>
                  )}
                  {cloudStatus === "offline" && (
                    <><CloudOff size={11} style={{ color: "var(--text-muted)" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Offline</span></>
                  )}
                </div>
              </div>

              {projectsLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "var(--text-dim)" }}>
                  <Loader2 size={15} className="animate-spin" />
                  <span className="text-xs">Loading cloud projects…</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {myProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border px-3.5 py-3 group transition-all"
                      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#00ff6630")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.title}</p>
                        <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                          {p.board} · {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button onClick={() => router.push(`/project/${p.id}`)} title="Open project"
                          className="p-1.5 rounded transition-colors" style={{ color: "var(--text-muted)" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                        ><ExternalLink size={13} /></button>
                        <button onClick={() => handleDelete(p.id)} title="Delete project" disabled={deletingId === p.id}
                          className="p-1.5 rounded transition-colors" style={{ color: "var(--text-muted)" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--accent-red)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                          {deletingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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
        className="py-3 text-center text-xs"
        style={{
          color: "var(--text-dim)",
          borderTop: "1px solid var(--border)",
        }}
      >
        Powered by Gemini AI · Built for engineers
      </footer>

      {showFeaturesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="rounded-xl border flex flex-col max-w-4xl w-full max-h-[85vh] overflow-hidden transition-all duration-300 relative animate-fade-in"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              boxShadow: "0 0 50px rgba(0, 255, 102, 0.08)",
            }}
          >
            <div
              className="flex-shrink-0 px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "var(--accent)" }} />
                <span
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  [EMBEDDY_SYSTEM_FEATURES]
                </span>
              </div>
              <button
                onClick={() => {
                  setShowFeaturesModal(false);
                  setActiveFeatureId(null);
                }}
                className="p-1 rounded border hover:bg-white/5 transition-colors"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              className="flex-shrink-0 px-6 py-3.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-raised)",
              }}
            >
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "ALL FEATURES" },
                  { id: "hardware", label: "HARDWARE & WIRING" },
                  { id: "software", label: "CODE & SOFTWARE" },
                  { id: "diagnostics", label: "DIAGNOSTICS & ANALYTICS" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedFeatureTab(tab.id);
                      setActiveFeatureId(null);
                    }}
                    className="px-3 py-1.5 rounded text-[10px] font-mono font-bold tracking-wider transition-all"
                    style={{
                      background:
                        selectedFeatureTab === tab.id
                          ? "#00ff6610"
                          : "transparent",
                      color:
                        selectedFeatureTab === tab.id
                          ? "var(--accent)"
                          : "var(--text-muted)",
                      border: `1px solid ${selectedFeatureTab === tab.id ? "#00ff6630" : "transparent"}`,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveFeatureId(null);
                }}
                className="px-3 py-1.5 rounded text-xs outline-none w-full md:w-48 font-mono border"
                style={{
                  background: "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const filtered = FEATURE_DETAILS.filter((f) => {
                  const matchesTab =
                    selectedFeatureTab === "all" ||
                    f.category === selectedFeatureTab;
                  const matchesSearch =
                    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    f.shortDesc
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    f.longDesc
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase());
                  return matchesTab && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div
                      className="col-span-2 py-12 text-center text-xs font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      NO COMPILING SYSTEM MATCHED THIS QUERY
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
                      className="rounded-lg border p-4 cursor-pointer card-hover relative overflow-hidden transition-[border-color,box-shadow] duration-200"
                      style={{
                        background: isActive
                          ? "rgba(0, 255, 102, 0.02)"
                          : "var(--bg)",
                        borderColor: isActive
                          ? "var(--accent)"
                          : "var(--border)",
                        boxShadow: isActive
                          ? "0 0 16px rgba(0, 255, 102, 0.04)"
                          : "none",
                      }}
                    >
                      <div
                        className="absolute top-0 right-0 w-16 h-16 rounded-full filter blur-xl opacity-10 pointer-events-none"
                        style={{ background: f.color }}
                      />

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded flex items-center justify-center"
                            style={{
                              background: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid var(--border)",
                              color: f.color,
                            }}
                          >
                            <Icon size={12} strokeWidth={2.5} />
                          </span>
                          <h4 className="text-sm font-semibold text-white">
                            {f.title}
                          </h4>
                        </div>
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{
                            background: `${f.color}15`,
                            color: f.color,
                            border: `1px solid ${f.color}30`,
                          }}
                        >
                          {f.badge}
                        </span>
                      </div>

                      <p
                        className="text-xs font-medium mb-1.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {f.shortDesc}
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {f.longDesc}
                      </p>

                      <div
                        className="mt-3 flex items-center gap-1 text-[9px] font-mono font-bold uppercase transition-colors"
                        style={{
                          color: isActive ? "var(--accent)" : "var(--text-dim)",
                        }}
                      >
                        <span>
                          {isActive
                            ? "[ACTIVE_EXPANSION]"
                            : "[CLICK_TO_EXPAND_METRICS]"}
                        </span>
                      </div>

                      {isActive && (
                        <div
                          className="mt-3 pt-3 border-t space-y-2.5 animate-fadeIn"
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
                              <div>
                                $ connectionGroup.highlight(&quot;comp_ESP32&quot;);
                              </div>
                            </div>
                          )}
                          {f.id === "pcb" && (
                            <div
                              className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[9px] font-mono text-[var(--accent)]"
                              style={{ borderColor: "var(--border)" }}
                            >
                              <span>✓ PCB auto-routing constraints met</span>
                              <span style={{ color: "var(--text-muted)" }}>
                                2 Layers
                              </span>
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
                                        idx < 10
                                          ? "var(--accent)"
                                          : "rgba(255,255,255,0.05)",
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
                              <span style={{ color: "var(--text-muted)" }}>
                                3.3V Logic
                              </span>
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
                              <div className="text-purple-400">
                                #include &lt;Wire.h&gt;
                              </div>
                              <div>
                                void setup() &#123; Wire.begin(); &#125;
                              </div>
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
                              <span>9 Pipelines compiling...</span>
                              <span style={{ color: "var(--accent)" }}>
                                READY in 28.4s
                              </span>
                            </div>
                          )}
                          {f.id === "pinout" && (
                            <div
                              className="p-2 rounded bg-black/40 border border-white/5 flex gap-1.5 flex-wrap"
                              style={{ borderColor: "var(--border)" }}
                            >
                              {["GPIO21", "GPIO22", "3V3", "GND"].map(
                                (p, idx) => (
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
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            <div
              className="flex-shrink-0 px-6 py-4 border-t flex items-center justify-end"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-raised)",
              }}
            >
              <button
                onClick={() => {
                  setShowFeaturesModal(false);
                  setActiveFeatureId(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{
                  background: "var(--accent)",
                  color: "#000",
                  boxShadow: "0 0 16px var(--accent-glow-strong)",
                }}
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
