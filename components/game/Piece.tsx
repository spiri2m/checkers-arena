"use client";

import { Crown } from "lucide-react";
import { motion } from "framer-motion";
import type { Piece as PieceType } from "@/types";
import { cn } from "@/lib/utils";

interface PieceProps {
  piece: PieceType;
  selected?: boolean;
  skin?: string;
}

export function Piece({ piece, selected, skin = "marble" }: PieceProps) {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "relative grid h-[78%] w-[78%] place-items-center rounded-full border-2 shadow-lg",
        piece.color === "white"
          ? "border-stone-200 bg-[radial-gradient(circle_at_35%_25%,#ffffff,#d7d3c9_62%,#9a9488)] text-slate-900"
          : "border-slate-700 bg-[radial-gradient(circle_at_35%_25%,#4b5563,#111827_64%,#020617)] text-amber-300",
        skin === "neon" && piece.color === "white" && "bg-[radial-gradient(circle_at_35%_25%,#fff7ed,#e5d2a6_65%,#7f1d1d)]",
        skin === "neon" && piece.color === "black" && "bg-[radial-gradient(circle_at_35%_25%,#57534e,#1c1917_62%,#09090b)]",
        selected && "ring-4 ring-accent"
      )}
    >
      <span className="absolute inset-[18%] rounded-full border border-white/30" />
      {piece.type === "king" ? <Crown className="relative h-[42%] w-[42%]" /> : null}
    </motion.div>
  );
}
