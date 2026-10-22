"use client";

import { useId, useState } from "react";
import { ROLE_PICKER } from "@/content/audiences";
import { parseRole, useRole, writeRole } from "@/lib/role";

/**
 * The one optional question at sign-up. It is stored on this device the moment it is chosen, so it
 * survives a Google sign-in redirect and a confirmation email, and nothing is sent to our server.
 * Skipping it is the default and changes nothing. The remembered role comes from `useRole`, which is
 * empty on the server and on first paint, so what the server sent and what the browser draws agree.
 */
export function RolePicker() {
  const name = useId();
  const role = useRole();
  // "Just looking" stores nothing, so it is remembered here, for this visit only.
  const [justLooking, setJustLooking] = useState(false);
  const selected = role ?? (justLooking ? "none" : "");
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{ROLE_PICKER.legend}</legend>
      <div className="grid gap-2">
        {ROLE_PICKER.options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-1 px-3.5 py-2 text-sm text-foreground has-[:checked]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected === option.value}
              onChange={() => {
                const next = parseRole(option.value);
                setJustLooking(next === null);
                writeRole(next);
              }}
              className="size-4 accent-[hsl(var(--primary))]"
            />
            {option.label}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{ROLE_PICKER.hint}</p>
    </fieldset>
  );
}
