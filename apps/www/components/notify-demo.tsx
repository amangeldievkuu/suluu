"use client";

import { NotifyMorph } from "suluu/notify-morph";

export function NotifyDemo() {
  return (
    <div className="relative z-10 flex min-h-24 items-center justify-center">
      <NotifyMorph onSubmit={() => undefined} />
    </div>
  );
}
