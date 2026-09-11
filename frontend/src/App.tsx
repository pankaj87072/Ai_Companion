import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, ApiError } from "./lib/api";
import { storage } from "./lib/storage";
import Chat from "./pages/Chat";
import Landing from "./pages/Landing";
import NameCompanion from "./pages/NameCompanion";
import SelectCompanion from "./pages/SelectCompanion";
import type { Companion } from "./types";

type Step = "loading" | "landing" | "select" | "name" | "chat";

export default function App() {
  const [step, setStep] = useState<Step>("loading");
  const [pendingCompanion, setPendingCompanion] = useState<Companion | null>(null);
  const [session, setSession] = useState<{
    userId: string;
    companion: Companion;
    companionName: string;
  } | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const existingUserId = storage.getUserId();
    const existingCompanionId = storage.getCompanionId();
    const existingCompanionName = storage.getCompanionName();

    if (existingUserId && existingCompanionId && existingCompanionName) {
      api
        .getCompanions()
        .then((companions) => {
          const companion = companions.find((c) => c.id === existingCompanionId);
          if (companion) {
            setSession({
              userId: existingUserId,
              companion,
              companionName: existingCompanionName,
            });
            setStep("chat");
          } else {
            setStep("landing");
          }
        })
        .catch(() => setStep("landing"));
    } else {
      setStep("landing");
    }
  }, []);

  const handleSelectCompanion = (companion: Companion) => {
    setPendingCompanion(companion);
    setStep("name");
  };

  const handleConfirmName = async (name: string) => {
    if (!pendingCompanion) return;
    try {
      const user = await api.createGuestUser(pendingCompanion.id, name);
      storage.setUserId(user.id);
      storage.setCompanionId(pendingCompanion.id);
      storage.setCompanionName(name);
      setSession({ userId: user.id, companion: pendingCompanion, companionName: name });
      setStep("chat");
    } catch (err) {
      setGlobalError(
        err instanceof ApiError
          ? err.message
          : "Couldn't create your companion right now. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-void text-zinc-50">
      {globalError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-500/90 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {globalError}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "loading" && <div key="loading" className="min-h-screen" />}

        {step === "landing" && (
          <motion.div key="landing" exit={{ opacity: 0 }}>
            <Landing onStart={() => setStep("select")} />
          </motion.div>
        )}

        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SelectCompanion onSelect={handleSelectCompanion} />
          </motion.div>
        )}

        {step === "name" && pendingCompanion && (
          <motion.div
            key="name"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <NameCompanion
              companion={pendingCompanion}
              onConfirm={handleConfirmName}
              onBack={() => setStep("select")}
            />
          </motion.div>
        )}

        {step === "chat" && session && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Chat
              userId={session.userId}
              companion={session.companion}
              companionName={session.companionName}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
