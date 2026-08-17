"use client";

import { useEffect, useState } from "react";

interface DocsTocItem {
  id: string;
  label: string;
}

interface DocsTocProps {
  items: readonly DocsTocItem[];
}

export function DocsToc({ items }: DocsTocProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    let animationFrame = 0;

    function updateActiveSection() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const pageBottom =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2;
        const marker = window.scrollY + Math.min(180, window.innerHeight * 0.3);
        let nextActiveId = items[0]?.id ?? "";

        for (const item of items) {
          const section = document.getElementById(item.id);
          if (!section) continue;

          const sectionTop =
            section.getBoundingClientRect().top + window.scrollY;
          if (sectionTop <= marker) nextActiveId = item.id;
        }

        if (pageBottom && items.length > 0) {
          nextActiveId = items[items.length - 1]?.id ?? nextActiveId;
        }

        setActiveId((current) =>
          current === nextActiveId ? current : nextActiveId,
        );
      });
    }

    updateActiveSection();
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("scroll", updateActiveSection, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("scroll", updateActiveSection);
    };
  }, [items]);

  return (
    <nav aria-label="On this page" className="hidden lg:block">
      <div className="sticky top-24 space-y-3 text-sm">
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <a
              aria-current={isActive ? "location" : undefined}
              className={`block transition-colors duration-200 ${
                isActive
                  ? "text-[var(--site-foreground)]"
                  : "text-[var(--site-muted)] hover:text-[var(--site-foreground)]"
              }`}
              href={`#${item.id}`}
              key={item.id}
              onClick={() => setActiveId(item.id)}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
