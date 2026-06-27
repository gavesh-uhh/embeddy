"use client";

import { BoardType } from "@/lib/types";

function getBadgeClass(board: BoardType): string {
  if (board.startsWith("Arduino")) return "badge-arduino";
  if (board.startsWith("ESP32")) return "badge-esp32";
  if (board.startsWith("STM32")) return "badge-stm32";
  return "badge-esp32";
}

export default function BoardBadge({ board }: { board: BoardType }) {
  return (
    <span
      className={`${getBadgeClass(board)} inline-flex items-center px-2 py-0.5 rounded text-xs font-medium`}
      style={{ borderRadius: "6px" }}
    >
      {board}
    </span>
  );
}
