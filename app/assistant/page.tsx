import type { Metadata } from "next";
import { Assistant } from "@/components/assistant/Assistant";

export const metadata: Metadata = { title: "Path Assistant" };

export default function AssistantPage() {
  return <Assistant />;
}
