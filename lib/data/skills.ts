import type { Skill } from "@/lib/types";

export const skills: Skill[] = [
  {
    slug: "sql",
    name: "SQL",
    category: "technical",
    summary: "Query and combine data stored in relational databases.",
    whyItMatters: "Almost every analyst, product and data role uses SQL to answer questions directly from company data.",
    howToStart: ["Learn SELECT, WHERE, GROUP BY and JOIN on a practice dataset", "Answer ten real questions about a public dataset", "Add the queries to a GitHub repository"],
    resources: [
      { title: "SQLBolt interactive lessons", provider: "SQLBolt", url: "https://sqlbolt.com", free: true },
      { title: "Intro to SQL", provider: "Kaggle Learn", url: "https://www.kaggle.com/learn/intro-to-sql", free: true },
    ],
    aliases: ["databases", "postgresql", "mysql", "queries"],
  },
  {
    slug: "python",
    name: "Python",
    category: "technical",
    summary: "A general-purpose programming language widely used for data, automation and software.",
    whyItMatters: "Python is the default language for data analysis, machine learning and scripting, and a common first language for engineers.",
    howToStart: ["Complete an introductory course with exercises", "Automate a small task you do weekly", "Analyse a dataset with pandas"],
    resources: [
      { title: "CS50's Introduction to Programming with Python", provider: "Harvard", url: "https://cs50.harvard.edu/python", free: true },
      { title: "Python", provider: "Kaggle Learn", url: "https://www.kaggle.com/learn/python", free: true },
    ],
    aliases: ["programming", "pandas", "coding"],
  },
  {
    slug: "excel",
    name: "Excel & spreadsheets",
    category: "technical",
    summary: "Build models, clean data and summarise results in spreadsheets.",
    whyItMatters: "Finance, consulting and business roles rely on spreadsheets daily for analysis and communication.",
    howToStart: ["Learn lookups, pivot tables and charts", "Rebuild a simple budget or financial statement", "Practise keyboard shortcuts"],
    resources: [{ title: "Excel training", provider: "Microsoft Support", url: "https://support.microsoft.com/excel", free: true }],
    aliases: ["spreadsheets", "google sheets", "pivot tables"],
  },
  {
    slug: "statistics",
    name: "Statistics",
    category: "analytical",
    summary: "Reason about data, uncertainty, sampling and relationships between variables.",
    whyItMatters: "Statistics helps you avoid misleading conclusions and is required for data, economics and research roles.",
    howToStart: ["Cover descriptive statistics, distributions and hypothesis tests", "Run a simple A/B test analysis", "Interpret a regression output"],
    resources: [
      { title: "Statistics and probability", provider: "Khan Academy", url: "https://www.khanacademy.org/math/statistics-probability", free: true },
      { title: "OpenIntro Statistics (textbook)", provider: "OpenIntro", url: "https://www.openintro.org/book/os", free: true },
    ],
    aliases: ["probability", "regression", "a/b testing"],
  },
  {
    slug: "data-visualization",
    name: "Data visualization",
    category: "analytical",
    summary: "Turn numbers into clear charts and dashboards that support decisions.",
    whyItMatters: "Analysts are judged on how clearly they communicate findings, not just on the analysis itself.",
    howToStart: ["Learn when to use bar, line and scatter charts", "Build a one-page dashboard", "Redesign a confusing chart you find online"],
    resources: [
      { title: "Data Visualization", provider: "Kaggle Learn", url: "https://www.kaggle.com/learn/data-visualization", free: true },
      { title: "Fundamentals of Data Visualization", provider: "Claus O. Wilke", url: "https://clauswilke.com/dataviz", free: true },
    ],
    aliases: ["dashboards", "tableau", "power bi", "charts"],
  },
  {
    slug: "financial-modeling",
    name: "Financial modelling",
    category: "analytical",
    summary: "Forecast a company's performance and value using structured spreadsheet models.",
    whyItMatters: "Core to investment banking, equity research, corporate finance and many consulting cases.",
    howToStart: ["Learn the three financial statements and how they link", "Build a simple DCF valuation", "Join a stock-pitch or research challenge"],
    resources: [{ title: "Finance Theory I", provider: "MIT OpenCourseWare", url: "https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008", free: true }],
    aliases: ["valuation", "dcf", "corporate finance"],
  },
  {
    slug: "accounting",
    name: "Accounting fundamentals",
    category: "analytical",
    summary: "Read and interpret balance sheets, income statements and cash-flow statements.",
    whyItMatters: "Accounting is the language of business; it underpins finance, consulting and entrepreneurship.",
    howToStart: ["Learn the accounting equation and double-entry", "Read an annual report of a company you know", "Summarise its financial health in one page"],
    resources: [{ title: "Finance and capital markets", provider: "Khan Academy", url: "https://www.khanacademy.org/economics-finance-domain/core-finance", free: true }],
    aliases: ["financial statements", "bookkeeping"],
  },
  {
    slug: "machine-learning",
    name: "Machine learning",
    category: "technical",
    summary: "Build models that learn patterns from data to make predictions.",
    whyItMatters: "ML skills open doors in data science, AI engineering and quantitative research.",
    howToStart: ["Learn supervised learning with scikit-learn", "Complete a beginner Kaggle competition", "Explain your model's errors in writing"],
    resources: [
      { title: "Machine Learning Specialization", provider: "DeepLearning.AI / Stanford on Coursera", url: "https://www.coursera.org/specializations/machine-learning-introduction", free: false },
      { title: "Practical Deep Learning for Coders", provider: "fast.ai", url: "https://course.fast.ai", free: true },
    ],
    aliases: ["ai", "deep learning", "data science"],
  },
  {
    slug: "software-development",
    name: "Software development",
    category: "technical",
    summary: "Design, write, test and ship working software.",
    whyItMatters: "The core skill of software engineering roles and a strong advantage for founders and product managers.",
    howToStart: ["Learn a language and data structures", "Use Git and GitHub daily", "Build and deploy a small web app people use"],
    resources: [
      { title: "CS50x: Introduction to Computer Science", provider: "Harvard", url: "https://cs50.harvard.edu/x", free: true },
      { title: "The Odin Project (web development)", provider: "The Odin Project", url: "https://www.theodinproject.com", free: true },
    ],
    aliases: ["programming", "coding", "javascript", "git", "web development", "algorithms"],
  },
  {
    slug: "product-thinking",
    name: "Product thinking",
    category: "analytical",
    summary: "Understand users, define problems and prioritise what to build.",
    whyItMatters: "Product managers and founders must turn user needs into clear decisions and trade-offs.",
    howToStart: ["Interview five users of an app you use", "Write a one-page problem statement and solution", "Prioritise a feature list and justify it"],
    resources: [{ title: "Digital Product Management", provider: "University of Virginia on Coursera", url: "https://www.coursera.org/specializations/uva-darden-digital-product-management", free: false }],
    aliases: ["product management", "user research", "prioritisation"],
  },
  {
    slug: "ux-design",
    name: "UX & interface design",
    category: "creative",
    summary: "Design usable, accessible interfaces and test them with real users.",
    whyItMatters: "Good design determines whether a product gets used; UX skills also strengthen PM and front-end roles.",
    howToStart: ["Learn Figma basics", "Redesign one flow of an app you use", "Run a usability test with three people"],
    resources: [
      { title: "Google UX Design Certificate", provider: "Google on Coursera", url: "https://www.coursera.org/professional-certificates/google-ux-design", free: false },
      { title: "Figma Learn", provider: "Figma", url: "https://help.figma.com", free: true },
    ],
    aliases: ["figma", "ui", "design", "user experience"],
  },
  {
    slug: "research-methods",
    name: "Research methods",
    category: "analytical",
    summary: "Design studies, collect evidence and draw sound conclusions.",
    whyItMatters: "Needed for academic research, policy analysis and evidence-driven roles in any sector.",
    howToStart: ["Learn qualitative and quantitative designs", "Replicate a published study with open data", "Assist a professor's research project"],
    resources: [{ title: "Understanding Research Methods", provider: "University of London on Coursera", url: "https://www.coursera.org/learn/research-methods", free: false }],
    aliases: ["research", "surveys", "experiments"],
  },
  {
    slug: "academic-writing",
    name: "Writing & argument",
    category: "communication",
    summary: "Write clear, structured, evidence-based arguments.",
    whyItMatters: "Essays, research reports, policy memos and scholarship applications all depend on strong writing.",
    howToStart: ["Write a one-page memo each week", "Enter an essay competition", "Get feedback from a teacher or peer"],
    resources: [{ title: "Purdue Online Writing Lab", provider: "Purdue University", url: "https://owl.purdue.edu", free: true }],
    aliases: ["writing", "essays", "communication"],
  },
  {
    slug: "public-speaking",
    name: "Public speaking",
    category: "communication",
    summary: "Present ideas confidently and persuasively to an audience.",
    whyItMatters: "Interviews, pitches, Model UN and leadership roles all reward clear spoken communication.",
    howToStart: ["Join a debate or Model UN club", "Present a project in under five minutes", "Record yourself and review"],
    resources: [{ title: "Toastmasters International", provider: "Toastmasters", url: "https://www.toastmasters.org", free: false }],
    aliases: ["presenting", "debate", "pitching"],
  },
  {
    slug: "leadership",
    name: "Leadership",
    category: "leadership",
    summary: "Motivate people, organise work and take responsibility for outcomes.",
    whyItMatters: "Scholarships such as Chevening and fellowships explicitly select for demonstrated leadership.",
    howToStart: ["Take on a defined role in a club or project", "Lead one initiative from idea to result", "Document the impact with numbers"],
    resources: [{ title: "Leading People and Teams", provider: "University of Michigan on Coursera", url: "https://www.coursera.org/specializations/leading-teams", free: false }],
    aliases: ["teamwork", "management", "initiative"],
  },
  {
    slug: "project-management",
    name: "Project management",
    category: "leadership",
    summary: "Plan, schedule and deliver projects on time with a team.",
    whyItMatters: "Every consulting, product and operations role involves running projects.",
    howToStart: ["Plan your applications as a project with milestones", "Learn basic agile practices", "Run a club event end to end"],
    resources: [{ title: "Google Project Management Certificate", provider: "Google on Coursera", url: "https://www.coursera.org/professional-certificates/google-project-management", free: false }],
    aliases: ["planning", "agile", "operations"],
  },
  {
    slug: "marketing-analytics",
    name: "Digital marketing & analytics",
    category: "analytical",
    summary: "Plan campaigns and measure them with web and social analytics.",
    whyItMatters: "Modern marketing roles are data-driven; analytics separates strong candidates.",
    howToStart: ["Learn Google Analytics basics", "Grow a page or newsletter and track results", "Write a short campaign report"],
    resources: [
      { title: "Skillshop (Google Analytics & Ads)", provider: "Google", url: "https://skillshop.withgoogle.com", free: true },
      { title: "HubSpot Academy", provider: "HubSpot", url: "https://academy.hubspot.com", free: true },
    ],
    aliases: ["marketing", "seo", "social media", "branding"],
  },
  {
    slug: "econometrics",
    name: "Economic analysis & econometrics",
    category: "analytical",
    summary: "Apply economic models and statistical methods to real-world data.",
    whyItMatters: "Economists, policy analysts and many researchers use econometrics to estimate causal effects.",
    howToStart: ["Learn regression and causal inference basics", "Replicate a simple economics paper", "Write a short policy brief using data"],
    resources: [{ title: "Marginal Revolution University", provider: "MRU", url: "https://mru.org", free: true }],
    aliases: ["economics", "policy analysis", "causal inference"],
  },
  {
    slug: "negotiation",
    name: "Negotiation",
    category: "communication",
    summary: "Reach agreements that create value for all sides.",
    whyItMatters: "Useful for consulting, sales, entrepreneurship and diplomacy.",
    howToStart: ["Learn interests vs. positions", "Practise in Model UN or case competitions", "Debrief what worked after each negotiation"],
    resources: [{ title: "Successful Negotiation", provider: "University of Michigan on Coursera", url: "https://www.coursera.org/learn/negotiation-skills", free: false }],
    aliases: ["persuasion", "sales", "diplomacy"],
  },
  {
    slug: "problem-solving",
    name: "Structured problem solving",
    category: "analytical",
    summary: "Break ambiguous problems into parts and reason to a recommendation.",
    whyItMatters: "Consulting case interviews and analyst roles test this directly.",
    howToStart: ["Practise issue trees on everyday problems", "Do two case interviews per week with a partner", "Join a case competition"],
    resources: [{ title: "Case interview preparation", provider: "McKinsey & Company", url: "https://www.mckinsey.com/careers/interviewing", free: true }],
    aliases: ["case interviews", "critical thinking", "analysis", "analytical thinking"],
  },
  {
    slug: "cloud-computing",
    name: "Cloud computing",
    category: "technical",
    summary: "Run and scale applications and data on platforms like AWS, Azure and Google Cloud.",
    whyItMatters: "Most companies now build on the cloud, so cloud skills appear in software, data, security and even product roles.",
    howToStart: ["Create a free-tier account on one cloud provider", "Deploy a small website or database", "Take a fundamentals certification such as AWS Cloud Practitioner"],
    resources: [
      { title: "AWS Skill Builder", provider: "Amazon Web Services", url: "https://skillbuilder.aws", free: true },
      { title: "Microsoft Learn — Azure Fundamentals", provider: "Microsoft", url: "https://learn.microsoft.com/training/azure/", free: true },
    ],
    aliases: ["aws", "azure", "gcp", "cloud", "devops"],
  },
  {
    slug: "cybersecurity",
    name: "Cybersecurity",
    category: "technical",
    summary: "Protect systems, networks and data from attacks.",
    whyItMatters: "Security talent is in short supply worldwide, and every sector — banks, government, telecoms — needs it.",
    howToStart: ["Learn networking and Linux basics", "Practise on free labs like TryHackMe or picoCTF", "Prepare for CompTIA Security+ or the Google Cybersecurity certificate"],
    resources: [
      { title: "picoCTF", provider: "Carnegie Mellon University", url: "https://picoctf.org", free: true },
      { title: "TryHackMe", provider: "TryHackMe", url: "https://tryhackme.com", free: false },
    ],
    aliases: ["security", "infosec", "networking", "ethical hacking"],
  },
];

export function getSkill(slug: string) {
  return skills.find((s) => s.slug === slug);
}

/** Map free-text skills a student typed to known skill slugs. */
export function resolveSkillSlugs(input: string[]): Set<string> {
  const out = new Set<string>();
  for (const raw of input) {
    const t = raw.trim().toLowerCase();
    if (!t) continue;
    for (const s of skills) {
      const name = s.name.toLowerCase();
      const loose = t.length >= 3;
      if (
        s.slug === t ||
        name === t ||
        (loose && name.includes(t)) ||
        s.aliases.some((a) => a === t || (loose && (t.includes(a) || a.includes(t))))
      ) {
        out.add(s.slug);
      }
    }
  }
  return out;
}
