import type { ReactNode } from "react";

import { ComponentsSidebar } from "@/components/components-sidebar";

export default function ComponentsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <ComponentsSidebar />
        {children}
      </div>
    </div>
  );
}
