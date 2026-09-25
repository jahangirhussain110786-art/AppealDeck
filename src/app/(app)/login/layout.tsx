import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AUTH } from "@/content/auth";

// The page is a client component, so its tab title is set here.
export const metadata: Metadata = { title: AUTH.login.title };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
