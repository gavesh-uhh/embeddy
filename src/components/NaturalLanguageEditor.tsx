"use client";

import { useState, useRef, useEffect } from "react";
import { ProjectData, ProjectContext } from "@/lib/types";
import {
  Send,
  X,
  AlertTriangle,
  Check,
  RotateCcw,
  Undo2,
  Redo2,
  Code2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  operations?: string[];
  warnings?: string[];
  questions?: string[];
  timestamp: Date;
  applied?: boolean;
}

interface NaturalLanguageEditorProps {
  project: ProjectData;
  onProjectUpdate: (updatedProject: ProjectData) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

interface ProjectSnapshot {
  project: ProjectData;
  timestamp: Date;
  command: string;
}

const SUGGESTED_COMMANDS = [
  "Add a temperature sensor",
  "Change to ESP32-S3",
  "Add a display",
  "Optimize for low power",
  "Remove the LED",
  "Add WiFi connectivity",
  "Explain the pin choices",
  "Suggest improvements",
  "Switch to Arduino code",
  "Use MicroPython",
  "Regenerate code skeleton",
  "Add serial debug output",
];

export default function NaturalLanguageEditor({
  project,
  onProjectUpdate,
  isGenerating,
  setIsGenerating,
}: NaturalLanguageEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<ProjectSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<ProjectSnapshot[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const buildProjectContext = (): ProjectContext => ({
    title: project.title,
    board: project.board,
    description: project.description,
    components: project.overview?.components || [],
    pins: project.pinDiagram?.pins || [],
    warnings: project.overview?.warnings || [],
    bomItems: project.bom?.items || [],
    fileContents: [],
    language: project.codeSkeleton?.language,
    framework: project.codeSkeleton?.framework,
  });

  const handleSend = async (command: string) => {
    if (!command.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: command,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setShowSuggestions(false);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/natural-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectContext: buildProjectContext(),
          userCommand: command,
          commandHistory,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          throw new Error(
            result.message ||
              `Rate limit exceeded. Please try again in ${result.resetIn || 60} seconds.`,
          );
        }
        throw new Error(result.error || "Failed to process command");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.explanation,
        operations: result.operations?.map((op: { type: string }) => op.type),
        warnings: result.warnings,
        questions: result.questions,
        timestamp: new Date(),
        applied: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCommandHistory((prev) => [...prev, command]);

      // If there are no questions and there are operations, auto-apply after showing explanation
      if (result.questions?.length === 0 && result.operations?.length > 0) {
        await applyOperations(result.operations, result.regenerated, command);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: `Error: ${error instanceof Error ? error.message : "Failed to process command"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyOperations = async (
    operations: unknown[],
    regenerated: Record<string, boolean>,
    command?: string,
  ) => {
    setIsGenerating(true);

    try {
      // Save snapshot before applying changes
      saveSnapshot(command || "Unknown command");

      // Build new project context based on operations
      let updatedProject = { ...project };
      const updatedContext = buildProjectContext();

      // Initialize components array if undefined
      if (!updatedContext.components) {
        updatedContext.components = [];
      }

      // Update components list based on operations
      // Track if we need to force code regeneration
      let forceCodeRegen = false;
      let newCodeLanguage: "C++" | "MicroPython" | undefined;
      let newCodeFramework: "Arduino" | "ESP-IDF" | "STM32 HAL" | undefined;

      for (const op of operations) {
        const operation = op as {
          type: string;
          component?: string;
          newBoard?: string;
          description?: string;
          oldPin?: string;
          newPin?: string;
          newSpecs?: string;
          aspect?: string;
          feature?: string;
          language?: "C++" | "MicroPython";
          framework?: "Arduino" | "ESP-IDF" | "STM32 HAL";
        };
        switch (operation.type) {
          case "add_component":
            if (
              operation.component &&
              !updatedContext.components.includes(operation.component)
            ) {
              updatedContext.components.push(operation.component);
            }
            break;
          case "remove_component":
            if (operation.component && updatedContext.components) {
              updatedContext.components = updatedContext.components.filter(
                (c) => c.toLowerCase() !== operation.component?.toLowerCase(),
              );
            }
            break;
          case "change_board":
            if (operation.newBoard) {
              updatedContext.board = operation.newBoard as ProjectData["board"];
            }
            break;
          case "modify_pin":
            // Update pin in the pins array
            if (
              operation.component &&
              operation.oldPin &&
              operation.newPin &&
              updatedContext.pins
            ) {
              const pinIndex = updatedContext.pins.findIndex(
                (p) =>
                  p.component === operation.component &&
                  (p.pin === operation.oldPin ||
                    p.boardPin === operation.oldPin),
              );
              if (pinIndex >= 0) {
                updatedContext.pins[pinIndex] = {
                  ...updatedContext.pins[pinIndex],
                  pin: operation.newPin,
                };
              }
            }
            break;
          case "update_component":
            // Update component specs - mark for regeneration
            if (operation.component && operation.newSpecs) {
              // Add note about the spec change to description
              updatedContext.description = `${updatedContext.description}\n\n${operation.component} specifications updated: ${operation.newSpecs}`;
            }
            break;
          case "add_feature":
            // Features are treated like component additions
            if (operation.feature) {
              updatedContext.description = `${updatedContext.description}\n\nAdditional feature requested: ${operation.feature}`;
            }
            break;
          case "change_code_language":
            // Update code generation preferences
            if (operation.language) {
              newCodeLanguage = operation.language;
              forceCodeRegen = true;
              // Store in description for context
              updatedContext.description = `${updatedContext.description}\n\nCode language preference: ${operation.language}${operation.framework ? ` with ${operation.framework} framework` : ""}`;
            }
            if (operation.framework) {
              newCodeFramework = operation.framework;
            }
            break;
          case "regenerate_code":
            // Force code regeneration
            forceCodeRegen = true;
            break;
          case "explain_design":
          case "suggest_improvements":
          case "optimize_power":
          case "check_compatibility":
            // These are informational operations, no state changes needed
            break;
          default:
            // Unknown operation type, log but continue
            console.warn("Unknown operation type:", operation.type);
        }
      }

      // Regenerate necessary sections
      const agentsToRun: {
        name: string;
        key: keyof ProjectData;
        fn: () => Promise<unknown>;
      }[] = [];

      if (regenerated.overview) {
        agentsToRun.push({
          name: "overview",
          key: "overview",
          fn: () =>
            fetch("/api/agents/overview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectContext: {
                  ...updatedContext,
                  description: `${updatedContext.description}\n\nAdditional components requested: ${(updatedContext.components ?? []).join(", ")}`,
                },
              }),
            }).then((r) => r.json()),
        });
      }

      if (regenerated.pinDiagram) {
        agentsToRun.push({
          name: "pinDiagram",
          key: "pinDiagram",
          fn: () =>
            fetch("/api/agents/pinDiagram", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectContext: {
                  board: updatedContext.board,
                  components: updatedContext.components,
                },
              }),
            }).then((r) => r.json()),
        });
      }

      if (regenerated.schematic) {
        agentsToRun.push({
          name: "schematic",
          key: "schematic",
          fn: () =>
            fetch("/api/agents/schematic", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectContext: {
                  board: updatedContext.board,
                  components: updatedContext.components,
                  pins: updatedContext.pins,
                },
              }),
            }).then((r) => r.json()),
        });
      }

      if (regenerated.bom) {
        agentsToRun.push({
          name: "bom",
          key: "bom",
          fn: () =>
            fetch("/api/agents/bom", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectContext: {
                  components: updatedContext.components,
                },
              }),
            }).then((r) => r.json()),
        });
      }

      if (regenerated.powerBudget) {
        agentsToRun.push({
          name: "powerBudget",
          key: "powerBudget",
          fn: () =>
            fetch("/api/agents/powerBudget", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectContext: {
                  board: updatedContext.board,
                  components: updatedContext.components,
                },
              }),
            }).then((r) => r.json()),
        });
      }

      if (regenerated.codeSkeleton || forceCodeRegen) {
        agentsToRun.push({
          name: "codeSkeleton",
          key: "codeSkeleton",
          fn: () =>
            fetch("/api/agents/codeSkeleton", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectContext: {
                  board: updatedContext.board,
                  components: updatedContext.components,
                  pins: updatedContext.pins,
                  language: newCodeLanguage || updatedContext.language,
                  framework: newCodeFramework || updatedContext.framework,
                },
              }),
            }).then((r) => r.json()),
        });
      }

      // Run all regeneration agents in parallel
      const results = await Promise.allSettled(agentsToRun.map((a) => a.fn()));

      results.forEach((result, index) => {
        const agent = agentsToRun[index];
        if (result.status === "fulfilled") {
          const value = result.value as { error?: string };
          if (!value.error) {
            (updatedProject as Record<string, unknown>)[agent.key] = value;
          }
        }
      });

      // Update project metadata
      updatedProject = {
        ...updatedProject,
        board: updatedContext.board,
        overview: updatedProject.overview
          ? {
              ...updatedProject.overview,
              components: updatedContext.components,
            }
          : undefined,
      };

      // Save and notify parent
      const { saveProject } = await import("@/lib/projectStore");
      await saveProject(updatedProject);
      onProjectUpdate(updatedProject);

      // Mark message as applied
      setMessages((prev) =>
        prev.map((m) =>
          m.id === prev[prev.length - 1]?.id ? { ...m, applied: true } : m,
        ),
      );
    } catch (error) {
      console.error("Error applying operations:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "system",
        content: `Failed to apply changes: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
    // Undo: Ctrl+Z or Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }
    // Redo: Ctrl+Y or Cmd+Shift+Z
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "y" || (e.key === "z" && e.shiftKey))
    ) {
      e.preventDefault();
      handleRedo();
    }
  };

  const handleSuggestedCommand = (cmd: string) => {
    setInput(cmd);
    handleSend(cmd);
  };

  const clearConversation = () => {
    setMessages([]);
    setCommandHistory([]);
    setShowSuggestions(true);
    setUndoStack([]);
    setRedoStack([]);
  };

  // Save current project state before applying changes
  const saveSnapshot = (command: string) => {
    const snapshot: ProjectSnapshot = {
      project: JSON.parse(JSON.stringify(project)), // Deep clone
      timestamp: new Date(),
      command,
    };
    setUndoStack((prev) => [...prev, snapshot]);
    setRedoStack([]); // Clear redo stack on new change
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const currentSnapshot: ProjectSnapshot = {
      project: JSON.parse(JSON.stringify(project)),
      timestamp: new Date(),
      command: "Current state",
    };

    const previousSnapshot = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [currentSnapshot, ...prev]);

    // Restore previous state
    onProjectUpdate(previousSnapshot.project);

    // Add system message
    const undoMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: `Undid changes from: "${previousSnapshot.command}"`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, undoMessage]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const currentSnapshot: ProjectSnapshot = {
      project: JSON.parse(JSON.stringify(project)),
      timestamp: new Date(),
      command: "Current state",
    };

    const nextSnapshot = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    setUndoStack((prev) => [...prev, currentSnapshot]);

    // Restore next state
    onProjectUpdate(nextSnapshot.project);

    // Add system message
    const redoMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: `Redid changes: "${nextSnapshot.command}"`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, redoMessage]);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
          style={{
            background: "var(--accent)",
            color: "#000",
            boxShadow: "0 4px 24px var(--accent-glow-strong)",
          }}
        >
          <Code2 size={18} strokeWidth={2.5} />
          <span className="font-semibold text-sm">Redesign with AI</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
            maxHeight: "600px",
            height: "500px",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--accent)", color: "#000" }}
              >
                <Code2 size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Design Assistant
                </h3>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Edit your project with natural language
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0 || isGenerating}
                className="p-2 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: "var(--text-muted)" }}
                title={`Undo (${undoStack.length} available)`}
              >
                <Undo2 size={16} />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0 || isGenerating}
                className="p-2 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: "var(--text-muted)" }}
                title={`Redo (${redoStack.length} available)`}
              >
                <Redo2 size={16} />
              </button>
              <button
                onClick={clearConversation}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--text-muted)" }}
                title="Clear conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && showSuggestions && (
              <div className="space-y-3">
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  Try asking me to modify your design:
                </p>
                <p
                  className="text-[10px] text-center opacity-60"
                  style={{ color: "var(--text-muted)" }}
                >
                  Tip: Press Ctrl+Z to undo, Ctrl+Y to redo changes
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_COMMANDS.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => handleSuggestedCommand(cmd)}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
                      style={{
                        background: "var(--surface-raised)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "rounded-br-md"
                      : message.role === "assistant"
                        ? "rounded-bl-md"
                        : "rounded-md"
                  }`}
                  style={{
                    background:
                      message.role === "user"
                        ? "var(--accent)"
                        : message.role === "system"
                          ? "rgba(255, 59, 59, 0.1)"
                          : "var(--surface-raised)",
                    color:
                      message.role === "user"
                        ? "#000"
                        : message.role === "system"
                          ? "var(--accent-red)"
                          : "var(--text-primary)",
                    border:
                      message.role === "assistant"
                        ? "1px solid var(--border)"
                        : message.role === "system"
                          ? "1px solid rgba(255, 59, 59, 0.3)"
                          : "none",
                  }}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>

                  {/* Operations badges */}
                  {message.operations && message.operations.length > 0 && (
                    <div
                      className="mt-3 pt-3 border-t flex flex-wrap gap-1.5"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {message.operations.map((op) => (
                        <span
                          key={op}
                          className="px-2 py-0.5 rounded text-[9px] font-mono font-medium uppercase tracking-wider"
                          style={{
                            background: "var(--accent-glow)",
                            color: "var(--accent)",
                            border: "1px solid var(--accent-glow-strong)",
                          }}
                        >
                          {op.replace(/_/g, " ")}
                        </span>
                      ))}
                      {message.applied && (
                        <span
                          className="flex items-center gap-1 ml-auto"
                          style={{ color: "var(--accent-green)" }}
                        >
                          <Check size={10} /> Applied
                        </span>
                      )}
                    </div>
                  )}

                  {/* Warnings */}
                  {message.warnings && message.warnings.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {message.warnings.map((warning, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 rounded text-xs"
                          style={{
                            background: "var(--accent-red-glow)",
                            color: "var(--accent-red)",
                            border: "1px solid rgba(255, 59, 59, 0.3)",
                          }}
                        >
                          <AlertTriangle
                            size={12}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Questions */}
                  {message.questions && message.questions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.questions.map((question, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(question)}
                          className="w-full text-left px-3 py-2 rounded text-xs transition-colors hover:opacity-80"
                          style={{
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className="text-[9px] mt-2 block opacity-50"
                    style={{
                      color:
                        message.role === "user" ? "#000" : "var(--text-muted)",
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-md px-4 py-3"
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: "var(--accent)" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{
                        background: "var(--accent)",
                        animationDelay: "0.2s",
                      }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{
                        background: "var(--accent)",
                        animationDelay: "0.4s",
                      }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Thinking...
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            className="p-4 border-t"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe changes to your design..."
                disabled={isGenerating}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isGenerating}
                className="p-2.5 rounded-xl transition-all"
                style={{
                  background:
                    input.trim() && !isGenerating
                      ? "var(--accent)"
                      : "var(--surface)",
                  color:
                    input.trim() && !isGenerating
                      ? "#000"
                      : "var(--text-muted)",
                  opacity: input.trim() && !isGenerating ? 1 : 0.5,
                }}
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </div>
            <p
              className="text-[10px] mt-2 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              AI may make mistakes. Review changes before building.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
