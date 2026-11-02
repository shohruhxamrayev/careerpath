import type {
  ActivityType,
  AidForInternational,
  ApplicationStatus,
  DegreeLevel,
  Field,
  Interest,
  OpportunityType,
  Region,
  Selectivity,
  StudentLevel,
  TuitionBand,
} from "@/lib/types";

export const FIELD_LABELS: Record<Field, string> = {
  business: "Business & Management",
  economics: "Economics",
  finance: "Finance & Accounting",
  "computer-science": "Computer Science",
  "data-science": "Data Science & AI",
  engineering: "Engineering",
  mathematics: "Mathematics",
  "natural-sciences": "Natural Sciences",
  "medicine-health": "Medicine & Health",
  law: "Law",
  "politics-ir": "Politics & International Relations",
  "social-sciences": "Social Sciences",
  humanities: "Humanities",
  "arts-design": "Arts & Design",
  education: "Education",
  environment: "Environment & Sustainability",
  architecture: "Architecture",
  "media-communications": "Media & Communications",
};
export const FIELDS = Object.keys(FIELD_LABELS) as Field[];

export const INTEREST_LABELS: Record<Interest, string> = {
  business: "Business",
  economics: "Economics",
  finance: "Finance",
  technology: "Technology",
  science: "Science",
  politics: "Politics & Policy",
  arts: "Arts",
  design: "Design",
  health: "Health",
  law: "Law",
  education: "Education",
  environment: "Environment",
  media: "Media",
  entrepreneurship: "Entrepreneurship",
  "social-impact": "Social impact",
  research: "Research",
};
export const INTERESTS = Object.keys(INTEREST_LABELS) as Interest[];

/** How interests relate to academic fields — used by matching. */
export const INTEREST_FIELDS: Record<Interest, Field[]> = {
  business: ["business", "finance", "economics"],
  economics: ["economics", "finance", "politics-ir"],
  finance: ["finance", "economics", "business"],
  technology: ["computer-science", "data-science", "engineering"],
  science: ["natural-sciences", "mathematics", "medicine-health", "environment"],
  politics: ["politics-ir", "law", "social-sciences"],
  arts: ["arts-design", "humanities", "media-communications"],
  design: ["arts-design", "architecture", "computer-science"],
  health: ["medicine-health", "natural-sciences"],
  law: ["law", "politics-ir"],
  education: ["education", "social-sciences"],
  environment: ["environment", "natural-sciences", "engineering"],
  media: ["media-communications", "arts-design"],
  entrepreneurship: ["business", "computer-science", "economics"],
  "social-impact": ["social-sciences", "politics-ir", "education", "environment"],
  research: ["natural-sciences", "mathematics", "social-sciences", "data-science"],
};

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  scholarship: "Scholarship",
  competition: "Competition",
  internship: "Internship",
  fellowship: "Fellowship",
  exchange: "Exchange",
  "summer-program": "Summer program",
  volunteering: "Volunteering",
  conference: "Conference",
  job: "Job",
  grant: "Grant",
};
export const OPPORTUNITY_TYPE_PLURAL: Record<OpportunityType, string> = {
  scholarship: "Scholarships",
  competition: "Competitions",
  internship: "Internships",
  fellowship: "Fellowships",
  exchange: "Exchange programs",
  "summer-program": "Summer programs",
  volunteering: "Volunteering",
  conference: "Conferences",
  job: "Jobs",
  grant: "Grants",
};
export const OPPORTUNITY_TYPES = Object.keys(OPPORTUNITY_TYPE_LABELS) as OpportunityType[];

export const STUDENT_LEVEL_LABELS: Record<StudentLevel, string> = {
  "high-school": "High school",
  undergraduate: "Undergraduate",
  masters: "Master's",
  phd: "PhD",
  graduate: "Graduated / working",
};

export const DEGREE_LEVEL_LABELS: Record<DegreeLevel, string> = {
  undergraduate: "Bachelor's",
  masters: "Master's",
  phd: "PhD",
};

export const REGIONS: Region[] = ["North America", "United Kingdom", "Europe", "East Asia", "Southeast Asia", "Central Asia", "Middle East", "Oceania", "South Asia", "Latin America", "Africa"];

export const TUITION_BAND_LABELS: Record<TuitionBand, string> = {
  "under-5k": "Under $5k",
  "5-15k": "$5k–15k",
  "15-30k": "$15k–30k",
  "30-50k": "$30k–50k",
  "50k-plus": "$50k+",
};
export const TUITION_BAND_MAX: Record<TuitionBand, number> = {
  "under-5k": 5000,
  "5-15k": 15000,
  "15-30k": 30000,
  "30-50k": 50000,
  "50k-plus": 80000,
};
export const TUITION_BAND_MIN: Record<TuitionBand, number> = {
  "under-5k": 0,
  "5-15k": 5000,
  "15-30k": 15000,
  "30-50k": 30000,
  "50k-plus": 50000,
};

export const AID_LABELS: Record<AidForInternational, string> = {
  "need-based-full": "Full need-based aid",
  "need-based-limited": "Limited need-based aid",
  merit: "Merit scholarships",
  government: "Government / grant places",
  limited: "Limited aid",
};

export const SELECTIVITY_LABELS: Record<Selectivity, string> = {
  most: "Extremely selective",
  high: "Highly selective",
  moderate: "Selective",
  accessible: "Broadly accessible",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: "Interested",
  preparing: "Preparing",
  applied: "Applied",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
};
export const STATUSES = Object.keys(STATUS_LABELS) as ApplicationStatus[];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  club: "Club / society",
  leadership: "Leadership role",
  volunteering: "Volunteering",
  competition: "Competition",
  project: "Project",
  research: "Research",
  work: "Work experience",
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const COUNTRIES = [
  "Uzbekistan", "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Afghanistan", "Azerbaijan", "Georgia", "Armenia",
  "Russia", "Ukraine", "Belarus", "Turkey", "Iran", "Pakistan", "India", "Bangladesh", "Nepal", "Sri Lanka",
  "China", "Hong Kong SAR", "Japan", "South Korea", "Mongolia", "Singapore", "Malaysia", "Indonesia", "Vietnam", "Thailand", "Philippines",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Egypt", "Morocco", "Nigeria", "Kenya", "Ghana", "South Africa", "Ethiopia",
  "United Kingdom", "Ireland", "Germany", "France", "Netherlands", "Belgium", "Switzerland", "Italy", "Spain", "Portugal",
  "Austria", "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czechia", "Hungary", "Romania", "Greece",
  "United States", "Canada", "Mexico", "Brazil", "Argentina", "Chile", "Colombia", "Peru", "Australia", "New Zealand",
].sort();

export const STUDY_DESTINATIONS = [
  "United States", "United Kingdom", "Canada", "Germany", "Netherlands", "Switzerland", "Italy", "Belgium", "France",
  "Singapore", "Japan", "South Korea", "Hong Kong SAR", "China", "Hungary", "Turkey", "Uzbekistan", "Kazakhstan", "Kyrgyzstan", "Australia",
];

export const EU_EEA = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
  "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania",
  "Slovakia", "Slovenia", "Spain", "Sweden", "Iceland", "Liechtenstein", "Norway",
];
