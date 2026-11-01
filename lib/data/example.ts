import { emptyProfile } from "@/lib/matching/profile";
import type { StudentProfile } from "@/lib/types";

/** A clearly labelled example profile used only for the home-page preview. */
export const EXAMPLE_PROFILE: StudentProfile = {
  ...emptyProfile("Example student"),
  personal: { name: "Example student", country: "Uzbekistan", city: "Tashkent", age: 19 },
  education: { institution: "Example university", level: "undergraduate", seeking: "masters", field: "business", major: "Finance", graduationYear: 2027, gpa: 3.7, gpaScale: 4 },
  tests: { ielts: 7.5, toefl: null, duolingo: null, sat: null, act: null, gre: null, gmat: null, other: "" },
  skills: { technical: ["Excel", "SQL"], soft: ["Public speaking", "Leadership"], languages: ["Uzbek", "English", "Russian"] },
  activities: [
    { id: "a1", type: "competition", title: "Case competition", months: 3 },
    { id: "a2", type: "leadership", title: "Finance society", role: "Treasurer", months: 12 },
  ],
  interests: ["business", "finance", "economics"],
  goals: { careers: ["financial-analyst"], industries: ["Banking"], countries: ["United Kingdom", "Germany"] },
  finance: { need: "full", budgetUSD: null },
};
