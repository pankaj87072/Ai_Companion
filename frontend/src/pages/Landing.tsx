import { motion } from "framer-motion";
import CreatureAvatar from "../components/CreatureAvatar";

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(168,130,255,0.12), transparent 55%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-md"
      >
        <div className="animate-float">
          <CreatureAvatar companionId="mochi" activity="idle" emotion="calm" size={180} />
        </div>

        <h1 className="mt-8 font-display text-4xl sm:text-5xl text-zinc-50 text-balance leading-tight">
          Someone&rsquo;s waiting.
        </h1>
        <p className="mt-4 text-base text-mist leading-relaxed text-balance">
          A little companion who listens, remembers, and gets to know you.
        </p>

        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-10 px-7 py-3.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm shadow-glow"
        >
          Meet your companion
        </motion.button>
      </motion.div>

      <p className="relative z-10 mt-16 text-xs text-zinc-600">Aura</p>
    </div>
  );
}
