"use client";

import { useEffect, useRef, useState } from "react";
import { EmailMorph } from "suluu/email-morph";

import type { DemoProps } from "./types";

const LOADING_DURATION = 850;
const SUCCESS_DURATION = 1650;

export function EmailMorphDemo({ compact = false }: DemoProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  function handleSubmit() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setLoading(true);
    setSuccess(false);

    const loadingTimer = window.setTimeout(() => {
      setLoading(false);
      setSuccess(true);

      const successTimer = window.setTimeout(
        () => setSuccess(false),
        SUCCESS_DURATION,
      );
      timersRef.current.push(successTimer);
    }, LOADING_DURATION);
    timersRef.current.push(loadingTimer);
  }

  return (
    <div
      className={`relative z-10 flex items-center justify-center ${
        compact ? "min-h-32" : "min-h-28"
      }`}
    >
      <EmailMorph
        aria-label="Newsletter email"
        loading={loading}
        onSubmit={handleSubmit}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          if (success) setSuccess(false);
        }}
        placeholder="you@example.com"
        success={success}
        value={value}
      />
    </div>
  );
}
