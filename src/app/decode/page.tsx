import { Metadata } from "next";
import DecodeClient from "./DecodeClient";
import { DECODE } from "@/content/marketing";

export const metadata: Metadata = {
  title: DECODE.pageTitle,
  description: DECODE.pageDescription,
  openGraph: {
    title: DECODE.pageTitle,
    description: DECODE.pageDescription,
  },
};

export default function DecodePage() {
  return <DecodeClient />;
}
