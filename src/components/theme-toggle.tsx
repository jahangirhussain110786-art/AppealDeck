"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SHARED } from "@/content/shared";

const noopSubscribe = () => () => {};

const OPTIONS = [
  { value: "system", label: SHARED.nav.themeSystem },
  { value: "light", label: SHARED.nav.themeLight },
  { value: "dark", label: SHARED.nav.themeDark },
] as const;

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // False on the server and during hydration, true afterwards — the theme is only known in the
  // browser, so neither the icon nor the check can be chosen until then without disagreeing
  // with the server render.
  const mounted = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const icon = !mounted ? (
    <Moon />
  ) : theme === "system" ? (
    <Monitor />
  ) : resolvedTheme === "dark" ? (
    <Moon />
  ) : (
    <Sun />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={SHARED.nav.themeMenu}>
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{SHARED.nav.themeMenu}</DropdownMenuLabel>
        {OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={mounted && theme === option.value}
            onCheckedChange={() => setTheme(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
