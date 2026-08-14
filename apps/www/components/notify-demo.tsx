"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { NotifyMorph } from "suluu/notify-morph";

export function NotifyDemo() {
  const [message, setMessage] = useState("");

  return (
    <div className="relative z-10 flex min-h-24 flex-col items-center justify-center gap-4">
      <NotifyMorph
        label="Get updates"
        onSubmit={(email) => setMessage(`You're on the list, ${email}.`)}
      />
      <div
        aria-live="polite"
        className="h-5 text-center text-xs text-[var(--site-muted)]"
      >
        <AnimatePresence mode="wait">
          {message ? (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0, y: 4 }}
              key={message}
            >
              {message}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
