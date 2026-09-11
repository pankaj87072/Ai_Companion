import { motion } from "framer-motion";
import type { Companion } from "../types";
import CreatureAvatar from "./CreatureAvatar";

interface CompanionCardProps {
  companion: Companion;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}

export default function CompanionCard({
  companion,
  selected,
  dimmed,
  onSelect,
}: CompanionCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className="relative flex flex-col items-center text-center rounded-3xl glass p-6 sm:p-7 w-full"
      animate={{
        scale: selected ? 1.04 : 1,
        opacity: dimmed ? 0.45 : 1,
        borderColor: selected ? "rgba(196,165,255,0.5)" : "rgba(255,255,255,0.08)",
      }}
      whileHover={{ scale: selected ? 1.04 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        boxShadow: selected
          ? "0 0 70px -20px rgba(168,130,255,0.55)"
          : "none",
      }}
    >
      <CreatureAvatar
        companionId={companion.id}
        size={128}
        activity="idle"
        emotion={selected ? "happy" : "neutral"}
      />
      <h3 className="mt-4 font-display text-xl text-zinc-50">{companion.name}</h3>
      <p className="mt-1.5 text-xs text-mist tracking-wide">
        {companion.traits.slice(0, 3).join(" · ")}
      </p>
      <p className="mt-3 text-sm text-zinc-400 italic leading-relaxed">
        &ldquo;{companion.quote}&rdquo;
      </p>
    </motion.button>
  );
}
