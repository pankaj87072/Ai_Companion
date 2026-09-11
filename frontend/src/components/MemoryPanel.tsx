import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Memory } from "../types";

interface MemoryPanelProps {
  userId: string;
  companionName: string;
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  fact: "About you",
  preference: "Preferences",
  goal: "Goals",
  relationship: "People in your life",
  life_event: "Life events",
  emotional_context: "How you've been feeling",
};

export default function MemoryPanel({
  userId,
  companionName,
  open,
  onClose,
}: MemoryPanelProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmForget, setConfirmForget] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    api
      .getMemories(userId)
      .then(setMemories)
      .catch(() => setError("Couldn't load memories right now."))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const handleDelete = async (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.deleteMemory(id);
    } catch {
      setError("Couldn't delete that memory. Please try again.");
    }
  };

  const handleForgetAll = async () => {
    try {
      await api.forgetAllMemories(userId);
      setMemories([]);
      setConfirmForget(false);
    } catch {
      setError("Couldn't clear memories right now.");
    }
  };

  const grouped = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    acc[m.category] = acc[m.category] || [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-surface z-50 border-l border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h2 className="font-display text-lg text-zinc-50">
                What {companionName} remembers
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-zinc-400 hover:text-zinc-100 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {loading && <p className="text-sm text-mist">Loading memories...</p>}
              {error && <p className="text-sm text-rose-300">{error}</p>}
              {!loading && memories.length === 0 && !error && (
                <p className="text-sm text-mist leading-relaxed">
                  {companionName} doesn't remember anything yet. Keep talking, and things
                  worth remembering will show up here.
                </p>
              )}

              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <p className="text-xs uppercase tracking-wide text-violet-300/70 mb-2.5">
                    {CATEGORY_LABELS[category] ?? category}
                  </p>
                  <ul className="space-y-2">
                    {items.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-start justify-between gap-3 glass rounded-xl px-3.5 py-2.5 text-sm text-zinc-200"
                      >
                        <span className="leading-relaxed">{m.content}</span>
                        <button
                          onClick={() => handleDelete(m.id)}
                          aria-label="Forget this memory"
                          className="text-zinc-500 hover:text-rose-300 shrink-0 mt-0.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {memories.length > 0 && (
              <div className="px-6 py-5 border-t border-white/10">
                {!confirmForget ? (
                  <button
                    onClick={() => setConfirmForget(true)}
                    className="w-full text-sm text-rose-300/90 hover:text-rose-200 py-2.5 rounded-xl border border-rose-400/20 hover:bg-rose-400/5 transition-colors"
                  >
                    Forget everything
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-mist text-center">
                      This can't be undone. Are you sure?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmForget(false)}
                        className="flex-1 text-sm text-zinc-300 py-2.5 rounded-xl border border-white/10 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleForgetAll}
                        className="flex-1 text-sm text-white py-2.5 rounded-xl bg-rose-500/80 hover:bg-rose-500"
                      >
                        Forget all
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
