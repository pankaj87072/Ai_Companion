import { motion } from "framer-motion";
import type { CompanionActivity, CompanionEmotion } from "../types";

interface CreatureAvatarProps {
  companionId: string;
  activity?: CompanionActivity;
  emotion?: CompanionEmotion;
  size?: number;
  className?: string;
  /** Show expanding audio-like rings, used in voice mode while listening. */
  showListeningRings?: boolean;
}

const ACCENTS: Record<string, { from: string; to: string; body: string; cheek: string }> = {
  mochi: { from: "#FFB199", to: "#FF7CA3", body: "#FFD9C7", cheek: "#FF8FA3" },
  boba: { from: "#8EC5FF", to: "#B18CFF", body: "#DCE6FF", cheek: "#A9C4FF" },
  mimi: { from: "#FF9DE2", to: "#B18CFF", body: "#FBE0FF", cheek: "#FF9DC7" },
  miso: { from: "#B18CFF", to: "#7C9BFF", body: "#E4E0FF", cheek: "#C7B8FF" },
  kumo: { from: "#C58CFF", to: "#FF8FC7", body: "#EAD9FF", cheek: "#E3ABFF" },
};

// Emotion tints the aura glow so the whole creature feels warmer/cooler with mood,
// on top of its own base accent color.
const EMOTION_GLOW: Record<CompanionEmotion, string> = {
  neutral: "255,255,255",
  happy: "255,214,153",
  excited: "255,163,102",
  calm: "163,196,255",
  comforting: "255,163,199",
  concerned: "196,181,255",
};

function motionForActivity(activity: CompanionActivity, emotion: CompanionEmotion) {
  if (activity === "listening") {
    return { scale: [1, 1.05, 1], transition: { duration: 1.1, repeat: Infinity } };
  }
  if (activity === "thinking") {
    return {
      rotate: [-2, 2, -2],
      y: [0, -2, 0],
      transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
    };
  }
  if (activity === "speaking") {
    return {
      scale: [1, 1.035, 0.99, 1.025, 1],
      transition: { duration: 1.3, repeat: Infinity, ease: "easeInOut" },
    };
  }

  // idle activity: motion still reflects emotion, so the creature never looks inert.
  switch (emotion) {
    case "excited":
      return { y: [0, -10, 0], transition: { duration: 0.7, repeat: Infinity } };
    case "comforting":
      return { scale: [1, 1.02, 1], y: [0, 2, 0], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } };
    case "concerned":
      return { rotate: [-1.5, 1.5, -1.5], transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } };
    case "calm":
      return { scale: [1, 1.015, 1], transition: { duration: 5, repeat: Infinity } };
    case "happy":
      return { scale: [1, 1.035, 1], transition: { duration: 2.4, repeat: Infinity } };
    default:
      return { scale: [1, 1.02, 1], transition: { duration: 4.5, repeat: Infinity } };
  }
}

function Face({ id, emotion }: { id: string; emotion: CompanionEmotion }) {
  const sleepyBreed = id === "boba"; // Boba's resting face is gentle closed eyes.

  if (emotion === "comforting") {
    return (
      <g>
        <g stroke="#2B2230" strokeWidth="3.2" strokeLinecap="round">
          <path d="M 74 95 q 8 6 16 0" fill="none" />
          <path d="M 118 95 q 8 6 16 0" fill="none" />
        </g>
        <path
          d="M 92 112 Q 100 118 108 112"
          stroke="#2B2230"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  if (emotion === "concerned") {
    return (
      <g>
        <g stroke="#2B2230" strokeWidth="2.4" strokeLinecap="round">
          <path d="M 76 82 q 8 -4 15 -1" fill="none" />
          <path d="M 109 81 q 7 -3 15 1" fill="none" />
        </g>
        <circle cx="85" cy="93" r="6.5" fill="#2B2230" />
        <circle cx="123" cy="93" r="6.5" fill="#2B2230" />
        <path
          d="M 93 113 Q 100 110 107 113"
          stroke="#2B2230"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  if (emotion === "excited") {
    return (
      <g>
        <g fill="#2B2230">
          <circle cx="85" cy="90" r="8" />
          <circle cx="123" cy="90" r="8" />
        </g>
        <g fill="white">
          <circle cx="88" cy="86.5" r="2.4" />
          <circle cx="126" cy="86.5" r="2.4" />
        </g>
        <path
          d="M 88 110 Q 100 122 112 110"
          stroke="#2B2230"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  if (emotion === "calm" || sleepyBreed) {
    return (
      <g stroke="#2B2230" strokeWidth="3.2" strokeLinecap="round">
        <path d="M 74 96 q 8 7 16 0" fill="none" />
        <path d="M 118 96 q 8 7 16 0" fill="none" />
        <path
          d="M 96 110 Q 100 113 104 110"
          stroke="#2B2230"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  if (id === "miso") {
    return (
      <g fill="#2B2230">
        <path d="M 76 88 q 9 -11 18 0 q -9 11 -18 0 Z" />
        <path d="M 116 88 q 9 -11 18 0 q -9 11 -18 0 Z" />
        <path
          d="M 96 108 Q 100 111 104 108"
          stroke="#2B2230"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  // default / happy / neutral
  return (
    <g>
      <circle cx="85" cy="92" r="7.5" fill="#2B2230" />
      <circle cx="125" cy="92" r="7.5" fill="#2B2230" />
      <circle cx="87.5" cy="89" r="2.2" fill="white" />
      <circle cx="127.5" cy="89" r="2.2" fill="white" />
      <path
        d="M 96 108 Q 100 113 104 108"
        stroke="#2B2230"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

function EarsAndFeatures({ id, colors }: { id: string; colors: (typeof ACCENTS)[string] }) {
  switch (id) {
    case "mochi":
      return (
        <g>
          <path d="M 55 55 L 45 15 L 85 48 Z" fill={colors.body} />
          <path d="M 60 50 L 55 26 L 78 46 Z" fill={colors.to} />
          <path d="M 155 55 L 165 15 L 125 48 Z" fill={colors.body} />
          <path d="M 150 50 L 155 26 L 132 46 Z" fill={colors.to} />
        </g>
      );
    case "boba":
      return (
        <g>
          <circle cx="52" cy="42" r="22" fill={colors.body} />
          <circle cx="52" cy="42" r="11" fill={colors.to} />
          <circle cx="158" cy="42" r="22" fill={colors.body} />
          <circle cx="158" cy="42" r="11" fill={colors.to} />
        </g>
      );
    case "mimi":
      return (
        <g>
          <path d="M 68 60 C 55 10, 78 -25, 92 -20 C 100 20, 92 55, 84 68 Z" fill={colors.body} />
          <path d="M 74 55 C 66 20, 80 -8, 88 -6 C 92 20, 87 45, 80 55 Z" fill={colors.to} />
          <path d="M 142 60 C 155 10, 132 -25, 118 -20 C 110 20, 118 55, 126 68 Z" fill={colors.body} />
          <path d="M 136 55 C 144 20, 130 -8, 122 -6 C 118 20, 123 45, 130 55 Z" fill={colors.to} />
        </g>
      );
    case "miso":
      return (
        <g>
          <path d="M 58 52 L 50 18 L 88 46 Z" fill={colors.body} />
          <path d="M 152 52 L 160 18 L 122 46 Z" fill={colors.body} />
          <g stroke={colors.to} strokeWidth="2" strokeLinecap="round" opacity="0.8">
            <path d="M 40 100 L 15 95" />
            <path d="M 40 108 L 15 110" />
            <path d="M 160 100 L 185 95" />
            <path d="M 160 108 L 185 110" />
          </g>
        </g>
      );
    case "kumo":
      return (
        <g>
          <path d="M 78 40 C 76 20, 84 10, 90 8 C 88 22, 86 34, 84 42 Z" fill={colors.to} />
          <path d="M 122 40 C 124 20, 116 10, 110 8 C 112 22, 114 34, 116 42 Z" fill={colors.to} />
          <path
            d="M 30 110 C 5 95, 0 65, 10 55 C 22 70, 30 90, 38 108 Z"
            fill={colors.body}
            opacity="0.9"
          />
          <path
            d="M 180 110 C 205 95, 210 65, 200 55 C 188 70, 180 90, 172 108 Z"
            fill={colors.body}
            opacity="0.9"
          />
        </g>
      );
    default:
      return null;
  }
}

function Sparkles({ colors }: { colors: (typeof ACCENTS)[string] }) {
  const points = [
    { x: 28, y: 40, r: 3.2, delay: 0 },
    { x: 178, y: 55, r: 2.4, delay: 0.3 },
    { x: 20, y: 100, r: 2, delay: 0.6 },
    { x: 185, y: 110, r: 2.8, delay: 0.15 },
  ];
  return (
    <g>
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={colors.from}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: p.delay }}
        />
      ))}
    </g>
  );
}

export default function CreatureAvatar({
  companionId,
  activity = "idle",
  emotion = "neutral",
  size = 220,
  className = "",
  showListeningRings = false,
}: CreatureAvatarProps) {
  const colors = ACCENTS[companionId] ?? ACCENTS.mochi;
  const gradId = `grad-${companionId}`;
  const glowId = `glow-${companionId}`;
  const glowRgb = EMOTION_GLOW[emotion];

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {showListeningRings && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border"
              style={{ borderColor: `rgba(${glowRgb},0.35)` }}
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
            />
          ))}
        </>
      )}

      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, rgba(${glowRgb},0.4), ${colors.to}22 60%, transparent 75%)`,
        }}
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.svg
        viewBox="-15 -20 230 230"
        width={size}
        height={size}
        className="relative drop-shadow-[0_0_35px_rgba(168,130,255,0.25)]"
        animate={motionForActivity(activity, emotion)}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {emotion === "excited" && <Sparkles colors={colors} />}

        <g transform="translate(0, 20)">
          <EarsAndFeatures id={companionId} colors={colors} />
          <circle cx="100" cy="100" r="62" fill={`url(#${gradId})`} />
          <circle cx="100" cy="100" r="62" fill={`url(#${glowId})`} />
          <circle
            cx="66"
            cy="112"
            r="9"
            fill={colors.cheek}
            opacity={emotion === "comforting" || emotion === "happy" ? 0.85 : 0.5}
          />
          <circle
            cx="134"
            cy="112"
            r="9"
            fill={colors.cheek}
            opacity={emotion === "comforting" || emotion === "happy" ? 0.85 : 0.5}
          />
          <Face id={companionId} emotion={emotion} />
        </g>
      </motion.svg>
    </div>
  );
}
