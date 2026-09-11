import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Send, Sparkles, AudioLines } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatBubble from "../components/ChatBubble";
import CreatureAvatar from "../components/CreatureAvatar";
import MemoryPanel from "../components/MemoryPanel";
import VoiceModeView from "../components/VoiceModeView";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { api, ApiError } from "../lib/api";
import { detectEmotion } from "../lib/emotion";
import type {
  ChatMessage,
  Companion,
  CompanionActivity,
  CompanionEmotion,
} from "../types";

interface ChatProps {
  userId: string;
  companion: Companion;
  companionName: string;
}

const OPENING_LINES: Record<string, (name: string) => string> = {
  mochi: (name) =>
    `Hey.\n\nI'm ${name}.\n\nI don't know much about you yet...\n\nbut we can change that.\n\nWhat's on your mind?`,
  boba: (name) =>
    `Hi, I'm ${name}.\n\nNo rush at all. I'm happy just sitting here with you.\n\nWhat's going on today?`,
  mimi: (name) =>
    `Hiii, I'm ${name}!\n\nI'm so excited to get to know you.\n\nWhat's something you're thinking about right now?`,
  miso: (name) =>
    `Oh. Hi. I'm ${name}.\n\nI don't know anything about you yet, so try not to be too boring.\n\n...kidding. What's up?`,
  kumo: (name) =>
    `Hey, I'm ${name}.\n\nEvery friendship starts as a small adventure, and this is ours.\n\nWhat's on your mind today?`,
};

function localId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Chat({ userId, companion, companionName }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [activity, setActivity] = useState<CompanionActivity>("idle");
  const [emotion, setEmotion] = useState<CompanionEmotion>("neutral");
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false);
  const [micUnsupportedNotice, setMicUnsupportedNotice] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const { speak, stop: stopSpeaking, isSupported: ttsSupported, speakingId } =
    useSpeechSynthesis();

  const handleSendRef = useRef<(e?: React.FormEvent, overrideText?: string) => void>(
    () => {}
  );

  const { isSupported: sttSupported, isListening, start, stop } = useSpeechRecognition({
    onResult: (transcript) => {
      if (voiceMode) {
        handleSendRef.current(undefined, transcript);
      } else {
        setInput(transcript);
        setActivity("idle");
      }
    },
  });

  useEffect(() => {
    let cancelled = false;
    api
      .getConversation(userId)
      .then((history) => {
        if (cancelled) return;
        if (history.length === 0) {
          const opener =
            OPENING_LINES[companion.id]?.(companionName) ??
            `Hi, I'm ${companionName}. I'd love to get to know you. What's on your mind?`;
          setMessages([
            {
              id: localId(),
              role: "assistant",
              content: opener,
              created_at: new Date().toISOString(),
            },
          ]);
        } else {
          setMessages(history);
        }
      })
      .catch(() => setErrorText("Couldn't load your conversation. Try refreshing."))
      .finally(() => setLoadingHistory(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (isListening) setActivity("listening");
    else setActivity((prev) => (prev === "listening" ? "idle" : prev));
  }, [isListening]);

  useEffect(() => {
    if (speakingId) setActivity("speaking");
    else setActivity((prev) => (prev === "speaking" ? "idle" : prev));
  }, [speakingId]);

  const handleMicClick = () => {
    if (!sttSupported) {
      setMicUnsupportedNotice(true);
      setTimeout(() => setMicUnsupportedNotice(false), 3500);
      return;
    }
    if (isListening) {
      stop();
    } else {
      stopSpeaking();
      start();
    }
  };

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const trimmed = (overrideText ?? input).trim();
    if (!trimmed || sending) return;

    setErrorText(null);
    if (!overrideText) setInput("");
    stopSpeaking();

    const detectedEmotion = detectEmotion(trimmed);
    setEmotion(detectedEmotion);

    const userMessage: ChatMessage = {
      id: localId(),
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    setActivity("thinking");

    try {
      const res = await api.sendMessage(userId, trimmed);
      const assistantMessage: ChatMessage = {
        id: localId(),
        role: "assistant",
        content: res.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setActivity("idle");

      if (voiceMode && ttsEnabled && ttsSupported) {
        speak(res.reply, assistantMessage.id);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : `${companionName} couldn't connect right now. Try again in a moment.`;
      setErrorText(message);
      setEmotion("concerned");
      setActivity("idle");
    } finally {
      setSending(false);
    }
  };

  handleSendRef.current = handleSend;

  if (voiceMode) {
    return (
      <AnimatePresence>
        <VoiceModeView
          companion={companion}
          companionName={companionName}
          activity={activity}
          emotion={emotion}
          messages={messages}
          sending={sending}
          isListening={isListening}
          sttSupported={sttSupported}
          ttsSupported={ttsSupported}
          ttsEnabled={ttsEnabled}
          onToggleTts={() => {
            if (ttsEnabled) stopSpeaking();
            setTtsEnabled((v) => !v);
          }}
          onMicClick={handleMicClick}
          onExit={() => {
            stopSpeaking();
            if (isListening) stop();
            setVoiceMode(false);
          }}
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/5 glass sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <CreatureAvatar
            companionId={companion.id}
            activity={activity}
            emotion={emotion}
            size={44}
          />
          <div>
            <p className="font-display text-base text-zinc-50 leading-tight">{companionName}</p>
            <p className="text-xs text-mist leading-tight">
              {activity === "listening"
                ? "Listening..."
                : activity === "thinking"
                ? "Thinking..."
                : "your little companion"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceMode(true)}
            className="flex items-center gap-1.5 text-xs text-violet-300/90 hover:text-violet-200 glass px-3 py-2 rounded-full"
          >
            <AudioLines size={13} />
            <span className="hidden sm:inline">Voice mode</span>
          </button>
          <button
            onClick={() => setMemoryPanelOpen(true)}
            className="flex items-center gap-1.5 text-xs text-violet-300/90 hover:text-violet-200 glass px-3 py-2 rounded-full"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">What {companionName} remembers</span>
            <span className="sm:hidden">Memories</span>
          </button>
        </div>
      </header>

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col gap-3 max-w-2xl w-full mx-auto"
      >
        {loadingHistory && <p className="text-sm text-mist text-center mt-10">Loading...</p>}

        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            message={m}
            companionName={companionName}
            onSpeak={ttsSupported ? (text, id) => speak(text, id) : undefined}
            isSpeaking={speakingId === m.id}
          />
        ))}

        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {errorText && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs text-rose-300/90 py-2"
            >
              {errorText}
            </motion.p>
          )}
        </AnimatePresence>
      </main>

      <div className="px-4 sm:px-8 pb-6 pt-2 max-w-2xl w-full mx-auto">
        <AnimatePresence>
          {micUnsupportedNotice && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-mist text-center mb-2"
            >
              Voice input isn't supported in this browser. Text chat still works great.
            </motion.p>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 glass rounded-full px-2 py-2 pl-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Say something..."}
            disabled={sending}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none py-2"
          />
          <button
            type="button"
            onClick={handleMicClick}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            className={`p-2.5 rounded-full transition-colors ${
              isListening
                ? "bg-violet-500/80 text-white"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
            }`}
          >
            {isListening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send message"
            className="p-2.5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <MemoryPanel
        userId={userId}
        companionName={companionName}
        open={memoryPanelOpen}
        onClose={() => setMemoryPanelOpen(false)}
      />
    </div>
  );
}
