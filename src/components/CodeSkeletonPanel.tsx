"use client";

import { useEffect, useRef, useState } from "react";
import { CodeSkeleton } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";
import python from "highlight.js/lib/languages/python";
import "highlight.js/styles/github-dark.css";

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
      <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="panel-header">Code Skeleton</span>
        </div>
        <div className="p-4">
          <div className="rounded p-3 text-sm" style={{ background: "#f8514920", color: "#f85149", border: "1px solid #f8514940" }}>
            {error}
          </div>
          {onRetry && (
            <button onClick={onRetry} className="mt-3 px-3 py-1.5 rounded text-xs"
              style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              ↺ Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!codeSkeleton) return (
    <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Code Skeleton</span>
      </div>
      <SkeletonLoader lines={8} height="h-3" />
    </div>
  );

  return (
    <div className="rounded border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <span className="panel-header">Code Skeleton</span>
          <span className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--surface-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            {codeSkeleton.language}
          </span>
          <span className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--surface-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            {codeSkeleton.framework}
          </span>
        </div>
        <button
          onClick={handleCopy}
          id="copy-code-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            background: copied ? "#3fb95020" : "var(--surface-raised)",
            color: copied ? "#3fb950" : "var(--text-primary)",
            border: `1px solid ${copied ? "#3fb95040" : "var(--border)"}`,
          }}
        >
          {copied ? "✓ Copied!" : "⎘ Copy"}
        </button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: "500px", background: "#0d1117" }}>
        <pre className="p-4 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
          <code
            ref={codeRef}
            className={codeSkeleton.language === "MicroPython" ? "language-python" : "language-cpp"}
          />
        </pre>
      </div>
    </div>
  );
}
