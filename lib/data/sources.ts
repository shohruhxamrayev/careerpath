import type { DeadlineInfo, Source, VerificationStatus } from "@/lib/types";

/** Date the seed dataset was assembled. Used for the dataset notice, not as a verification claim. */
export const DATASET_COMPILED = "2026-11";

export const QS_SOURCE: Source = {
  org: "QS World University Rankings 2027",
  url: "https://www.topuniversities.com/world-university-rankings",
  status: "verified",
  lastVerified: "2026-11",
};

export function src(org: string, url: string, status: VerificationStatus = "indicative", note?: string): Source {
  return { org, url, status, ...(note ? { note } : {}) };
}

export function deadline(
  label: string,
  timing: string,
  months: number[],
  source: Source,
): DeadlineInfo {
  return { label, timing, months, source };
}

export const COMMON_APP = { name: "Common App", url: "https://www.commonapp.org" };
export const UCAS = { name: "UCAS", url: "https://www.ucas.com" };
export const OUAC = { name: "OUAC (Ontario)", url: "https://www.ouac.on.ca" };
