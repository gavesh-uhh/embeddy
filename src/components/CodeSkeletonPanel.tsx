"use client";

import { useEffect, useRef, useState } from "react";
import { CodeSkeleton } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";
import python from "highlight.js/lib/languages/python";
import "highlight.js/styles/github-dark.css";
import { Code2, Copy, Check, RotateCcw, XCircle } from "lucide-react";

hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("python", python);

interface Props {
  codeSkeleton?: CodeSkeleton;
  error?: string;
  onRetry?: () => void;
}

export default function CodeSkeletonPanel({ codeSkeleton, error, onRetry }: Props) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current && codeSkeleton?.code) {
      codeRef.current.innerHTML = codeSkeleton.code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      hljs.highlightElement(codeRef.current);
    }
  }, [codeSkeleton]);

  const handleCopy = async () => {
    if (!codeSkeleton?.code) return;
    await navigator.clipboard.writeText(codeSkeleton.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Code2 size={13} style={{ color: "var(--text-muted)" }} />
          <span className="panel-header">Code Skeleton</span>
        </div>
        <div className="p-4">
          <div className="rounded-lg p-3 text-xs flex items-start gap-2"
            style={{ background: "var(--accent-red-glow)", color: "var(--accent-red)", border: "1px solid #ff3b3b30" }}>
            <XCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
          </div>
          {onRetry && (
            <button onClick={onRetry}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              <RotateCcw size={11} /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!codeSkeleton) return (
    <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <Code2 size={13} style={{ color: "var(--text-muted)" }} />
        <span className="panel-header">Code Skeleton</span>
      </div>
      <SkeletonLoader lines={8} height="h-3" />
    </div>
  );

  return (
    <div className="rounded-lg border overflow-hidden card-hover" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Code2 size={13} style={{ color: "var(--accent)" }} />
          <span className="panel-header">Code Skeleton</span>
          <span className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: "#00ff6612", color: "var(--accent)", border: "1px solid #00ff6625" }}>
            {codeSkeleton.language}
          </span>
          <span className="px-2 py-0.5 rounded text-xs"
            style={{ background: "var(--surface-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            {codeSkeleton.framework}
          </span>
        </div>
        <button
          onClick={handleCopy}
          id="copy-code-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: copied ? "#00ff6612" : "var(--surface-raised)",
            color: copied ? "var(--accent)" : "var(--text-muted)",
            border: `1px solid ${copied ? "#00ff6630" : "var(--border)"}`,
          }}
        >
          {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: "600px", background: "#050505" }}>
        <pre className="p-5 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
          <code
            ref={codeRef}
            className={codeSkeleton.language === "MicroPython" ? "language-python" : "language-cpp"}
          />
        </pre>
      </div>
    </div>
  );
}
