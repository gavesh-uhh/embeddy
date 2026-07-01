"use client";

import { PCBLayout } from "@/lib/types";
import { useEffect, useRef } from "react";

interface Props {
  pcb: PCBLayout;
  activeLayer: "top" | "bottom" | "both";
}


const BOARD_COLOR = "#1a3520";
const BOARD_BORDER = "#2d5a3d";
const COPPER_TOP = "#ff9500";
const COPPER_BOTTOM = "#cc6600";
const SILKSCREEN = "#ffffff";
const PAD_COLOR = "#ffd700";

const VIA_COLOR = "#c0c0c0";


const SCALE = 10;
const PADDING = 20;

export default function PCBRenderer({ pcb, activeLayer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    
    const width = pcb.boardWidth * SCALE + PADDING * 2;
    const height = pcb.boardHeight * SCALE + PADDING * 2;

    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    
    ctx.clearRect(0, 0, width, height);

    const boardOffsetX = PADDING;
    const boardOffsetY = PADDING;

    
    ctx.fillStyle = BOARD_COLOR;
    ctx.strokeStyle = BOARD_BORDER;
    ctx.lineWidth = 2;
    ctx.fillRect(
      boardOffsetX,
      boardOffsetY,
      pcb.boardWidth * SCALE,
      pcb.boardHeight * SCALE,
    );
    ctx.strokeRect(
      boardOffsetX,
      boardOffsetY,
      pcb.boardWidth * SCALE,
      pcb.boardHeight * SCALE,
    );

    
    pcb.mountingHoles.forEach((hole) => {
      const x = boardOffsetX + hole.x * SCALE;
      const y = boardOffsetY + hole.y * SCALE;
      const radius = (hole.diameter / 2) * SCALE;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#00000040";
      ctx.fill();
      ctx.strokeStyle = BOARD_BORDER;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    
    pcb.traces.forEach((trace) => {
      if (activeLayer === "top" && trace.layer === "bottom") return;
      if (activeLayer === "bottom" && trace.layer === "top") return;

      const color =
        trace.layer === "top"
          ? COPPER_TOP
          : trace.layer === "bottom"
            ? COPPER_BOTTOM
            : VIA_COLOR;
      const width = Math.max(trace.width * SCALE, 2);

      if (trace.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startX = boardOffsetX + trace.points[0].x * SCALE;
      const startY = boardOffsetY + trace.points[0].y * SCALE;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < trace.points.length; i++) {
        const x = boardOffsetX + trace.points[i].x * SCALE;
        const y = boardOffsetY + trace.points[i].y * SCALE;
        ctx.lineTo(x, y);
      }

      ctx.stroke();

      
      if (trace.layer === "via") {
        const viaRadius = 0.3 * SCALE;
        trace.points.forEach((point) => {
          const x = boardOffsetX + point.x * SCALE;
          const y = boardOffsetY + point.y * SCALE;
          ctx.beginPath();
          ctx.arc(x, y, viaRadius, 0, Math.PI * 2);
          ctx.fillStyle = VIA_COLOR;
          ctx.fill();
          ctx.strokeStyle = "#808080";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    });

    
    if (activeLayer !== "bottom") {
      pcb.placements.forEach((placement) => {
        const x = boardOffsetX + placement.x * SCALE;
        const y = boardOffsetY + placement.y * SCALE;
        const rotation = (placement.rotation * Math.PI) / 180;

        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        
        const compWidth = 4 * SCALE; 
        const compHeight = 3 * SCALE; 

        ctx.strokeStyle = SILKSCREEN;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(-compWidth / 2, -compHeight / 2, compWidth, compHeight);
        ctx.setLineDash([]);

        
        ctx.fillStyle = SILKSCREEN;
        ctx.font = `${10 * (1 / SCALE) * SCALE}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(placement.name, 0, -compHeight / 2 - 5);

        
        ctx.font = `${8 * (1 / SCALE) * SCALE}px monospace`;
        ctx.fillStyle = "#cccccc";
        ctx.fillText(placement.footprint, 0, compHeight / 2 + 10);

        ctx.restore();
      });
    }

    
    pcb.pads.forEach((pad) => {
      if (activeLayer === "top" && pad.layer === "bottom") return;
      if (activeLayer === "bottom" && pad.layer === "top") return;

      const x = boardOffsetX + pad.x * SCALE;
      const y = boardOffsetY + pad.y * SCALE;
      const width = pad.width * SCALE;
      const height = pad.height * SCALE;

      
      ctx.fillStyle = PAD_COLOR;
      ctx.strokeStyle = "#b8860b";
      ctx.lineWidth = 1;

      if (pad.shape === "circle") {
        const radius = Math.max(width, height) / 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (pad.shape === "oval") {
        ctx.beginPath();
        ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        
        ctx.fillRect(x - width / 2, y - height / 2, width, height);
        ctx.strokeRect(x - width / 2, y - height / 2, width, height);
      }

      
      const holeRadius = Math.min(width, height) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
      ctx.fillStyle = BOARD_COLOR;
      ctx.fill();
    });

    
    ctx.strokeStyle = BOARD_BORDER;
    ctx.lineWidth = 3;
    ctx.strokeRect(
      boardOffsetX,
      boardOffsetY,
      pcb.boardWidth * SCALE,
      pcb.boardHeight * SCALE,
    );

    
    ctx.fillStyle = "#666";
    ctx.font = "10px monospace";

    
    ctx.fillText(
      `${pcb.boardWidth}mm`,
      boardOffsetX + (pcb.boardWidth * SCALE) / 2 - 15,
      boardOffsetY - 8,
    );

    
    ctx.save();
    ctx.translate(
      boardOffsetX - 15,
      boardOffsetY + (pcb.boardHeight * SCALE) / 2,
    );
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${pcb.boardHeight}mm`, 0, 0);
    ctx.restore();
  }, [pcb, activeLayer]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        margin: "0 auto",
        background: "#0d1a10",
        borderRadius: "4px",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
      }}
    />
  );
}
