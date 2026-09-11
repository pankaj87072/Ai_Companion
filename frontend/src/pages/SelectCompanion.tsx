import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import CompanionCard from "../components/CompanionCard";
import { api } from "../lib/api";
import type { Companion } from "../types";

interface SelectCompanionProps {
  onSelect: (companion: Companion) => void;
}

export default function SelectCompanion({ onSelect }: SelectCompanionProps) {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCompanions()
      .then(setCompanions)
      .catch(() => setError("Couldn't load companions right now. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (companion: Companion) => {
    setSelectedId(companion.id);
    setTimeout(() => onSelect(companion), 380);
  };

  return (
    <div className="min-h-screen px-6 py-16 flex flex-col items-center">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-3xl sm:text-4xl text-zinc-50 text-center text-balance"
      >
        Who would you like to meet?
      </motion.h1>

      {error && <p className="mt-8 text-sm text-rose-300">{error}</p>}
      {loading && <p className="mt-8 text-sm text-mist">Loading companions...</p>}

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl w-full">
        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            companion={companion}
            selected={selectedId === companion.id}
            dimmed={selectedId !== null && selectedId !== companion.id}
            onSelect={() => handleSelect(companion)}
          />
        ))}
      </div>
    </div>
  );
}
