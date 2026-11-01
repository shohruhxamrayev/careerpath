export type CheckStatus = "pass" | "warn" | "fail" | "unknown";

export interface Check {
  status: CheckStatus;
  label: string;
  detail?: string;
  group: "eligibility" | "fit";
}

export interface MatchComponent {
  key: string;
  label: string;
  score: number; // 0–100
  weight: number; // 0–1
}

export interface MatchResult {
  score: number; // 0–100 overall Profile Match
  eligible: boolean | null; // null when eligibility cannot be determined
  eligibilityScore: number;
  fitScore: number;
  components: MatchComponent[];
  checks: Check[];
  /** One-sentence explanation suitable for cards and recommendations. */
  reason: string;
}

export const MATCH_DISCLAIMER =
  "This is an informational match based on published criteria. It does not predict admission or selection.";

export function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function matchLabel(score: number): string {
  if (score >= 85) return "Strong match";
  if (score >= 70) return "Good match";
  if (score >= 55) return "Possible match";
  return "Weak match";
}
