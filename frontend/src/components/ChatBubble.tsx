import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { ChatMessage } from "../types";

interface ChatBubbleProps {
  message: ChatMessage;
  companionName: string;
  onSpeak?: (text: string, id: string) => void;
  isSpeaking?: boolean;
}

export default function ChatBubble({
  message,
  companionName,
  onSpeak,
  isSpeaking,
}: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[65%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-gradient-to-br from-violet-500/80 to-fuchsia-500/70 text-white rounded-br-md"
            : "glass text-zinc-100 rounded-bl-md"
        }`}
      >
        {!isUser && (
          <p className="text-[11px] text-violet-300/80 mb-1 font-medium">{companionName}</p>
        )}
        <p>{message.content}</p>
        {!isUser && onSpeak && (
          <button
            onClick={() => onSpeak(message.content, message.id)}
            aria-label="Play companion's message aloud"
            className={`mt-2 inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${
              isSpeaking ? "bg-violet-400/30 text-violet-200" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <Volume2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
