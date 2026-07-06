"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { QA } from "@/lib/campus-kb";

export function QaAccordion({ items }: { items: QA[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-2">
      {items.map((qa, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-line bg-surface"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
              aria-expanded={isOpen}
            >
              <Plus
                className={`mt-0.5 size-4 shrink-0 text-accent transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
              />
              <span className="text-[0.98rem] font-medium leading-snug text-ink">
                {qa.question}
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 pl-11 text-[0.95rem] leading-relaxed text-ink-soft">
                  {qa.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
