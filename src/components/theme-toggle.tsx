"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SHARED } from "@/content/shared";

const noopSubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // False on the server and during hydration, true afterwards — the theme is only known in the
  // browser, so the icon must not be chosen until then or the two renders would disagree.
  const mounted = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={SHARED.nav.themeToggle}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {mounted && !isDark ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{SHARED.nav.themeToggle}</TooltipContent>
    </Tooltip>
  );
}
