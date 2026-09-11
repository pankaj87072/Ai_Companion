import { AnimatePresence, motion } from "framer-motion";
import { Mic, Square, Volume2, VolumeX, X } from "lucide-react";
import CreatureAvatar from "./CreatureAvatar";
import type { ChatMessage, Companion, CompanionActivity, CompanionEmotion } from "../types";

interface VoiceModeViewProps {
  companion: Companion;
  companionName: string;
  activity: CompanionActivity;
  emotion: CompanionEmotion;
  messages: ChatMessage[];
  sending: boolean;
  isListening: boolean;
  sttSupported: boolean;
  ttsSupported: boolean;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  onMicClick: () => void;
  onExit: () => void;
}

export default function VoiceModeView({
  companion,
  companionName,
  activity,
  emotion,
  messages,
  sending,
  isListening,
  sttSupported,
  ttsSupported,
  ttsEnabled,
  onToggleTts,
  onMicClick,
  onExit,
}: VoiceModeViewProps) {
  const lastMessage = messages[messages.length - 1];

  const caption = isListening
    ? "Listening..."
    : sending
    ? "..."
    : lastMessage
    ? lastMessage.content
    : "Tap the mic and say something.";

  const captionSpeaker = isListening
    ? "You"
    : lastMessage?.role === "user"
    ? "You"
    : companionName;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-void flex flex-col items-center justify-between px-6 py-8 sm:py-12"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(168,130,255,0.10), transparent 60%)",
        }}
      />

      <div className="relative z-10 flex items-center justify-between w-full max-w-md">
        <button
          onClick={onExit}
          aria-label="Exit voice mode"
          className="p-2.5 rounded-full glass text-zinc-300 hover:text-white"
        >
          <X size={18} />
        </button>
        {ttsSupported && (
          <button
            onClick={onToggleTts}
            aria-label={ttsEnabled ? "Mute companion's voice" : "Unmute companion's voice"}
            className="p-2.5 rounded-full glass text-zinc-300 hover:text-white"
          >
            {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center flex-1 justify-center">
        <CreatureAvatar
          companionId={companion.id}
          activity={activity}
          emotion={emotion}
          size={260}
          showListeningRings={isListening}
        />

        <p className="mt-8 font-display text-lg text-zinc-50">{companionName}</p>

        <div className="mt-4 min-h-[4.5rem] max-w-sm text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={caption + captionSpeaker}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-xs uppercase tracking-wide text-violet-300/70 mb-1.5">
                {captionSpeaker}
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">{caption}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3">
        {!sttSupported && (
          <p className="text-xs text-mist text-center max-w-xs">
            Voice input isn't supported in this browser. Exit to use text chat instead.
          </p>
        )}
        <motion.button
          onClick={onMicClick}
          disabled={!sttSupported || sending}
          whileTap={{ scale: 0.94 }}
          aria-label={isListening ? "Stop listening" : "Start talking"}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 ${
            isListening
              ? "bg-violet-500 text-white"
              : "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-glow"
          }`}
        >
          {isListening ? <Square size={22} fill="currentColor" /> : <Mic size={26} />}
        </motion.button>
        <p className="text-xs text-zinc-600">
          {isListening ? "Tap to stop" : sending ? "Thinking..." : "Tap to talk"}
        </p>
      </div>
    </motion.div>
  );
}
