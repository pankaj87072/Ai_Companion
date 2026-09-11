import { motion } from "framer-motion";
import { useState } from "react";
import CreatureAvatar from "../components/CreatureAvatar";
import type { Companion } from "../types";

interface NameCompanionProps {
  companion: Companion;
  onConfirm: (name: string) => void;
  onBack: () => void;
}

export default function NameCompanion({ companion, onConfirm, onBack }: NameCompanionProps) {
  const [name, setName] = useState(companion.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-sm w-full"
      >
        <CreatureAvatar companionId={companion.id} activity="idle" emotion="happy" size={150} />

        <h1 className="mt-6 font-display text-2xl sm:text-3xl text-zinc-50 text-balance">
          What should I call them?
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 w-full flex flex-col items-center gap-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Give them a name..."
            maxLength={40}
            className="w-full text-center glass rounded-2xl px-5 py-3.5 text-lg text-zinc-50 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
          />

          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={!name.trim()}
            className="px-7 py-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm disabled:opacity-40 shadow-glow"
          >
            Start talking to {name.trim() || "them"}
          </motion.button>

          <button
            type="button"
            onClick={onBack}
            className="text-xs text-zinc-500 hover:text-zinc-300 mt-1"
          >
            Choose a different companion
          </button>
        </form>
      </motion.div>
    </div>
  );
}
