/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ONLY FILE YOU NEED TO EDIT.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Everything the site renders comes from this file.
 *
 *  Most of it is filled in from your resume and your portfolio doc. Anything
 *  still wrapped in [SQUARE BRACKETS] is something I could not source and you
 *  need to supply. Search this file for "[" to find every one.
 *
 *  The `impact` field on each project is the biggest remaining gap. Your write-
 *  ups describe what each system DOES very well, but almost never what changed
 *  because of it. "Cut the hiring cycle from 3 weeks to 6 days" is worth more
 *  than any feature list — fill those in wherever you can remember real figures,
 *  and leave the rest empty rather than inventing them.
 */

/* ── Types ──────────────────────────────────────────────────────────────── */

export type Identity = {
  name: string;
  /** Post-nominals, e.g. "CLSSGB". null to hide. */
  credentials: string | null;
  role: string;
  /** The other hats. Rendered as a separated list under the role. */
  disciplines: string[];
  location: string | null;
  /** The hero paragraph — the first thing anyone reads. */
  statement: string;
  siteUrl: string;
  availableForWork: boolean;
  availabilityNote: string | null;
};

export type SocialLink = {
  label: string;
  href: string;
  handle: string;
};

export type Project = {
  slug: string;
  name: string;
  /** One line, plain language. */
  tagline: string;
  /** 2–4 sentences: the problem, the approach, what it does. */
  description: string;
  /** Notable capabilities. Rendered as a list — keep each to one line. */
  capabilities: string[];

  /* The spec rail. Every project shows these five labels in this order, so a
   * reader can compare down the column. Any field left null renders as an
   * em dash rather than being papered over. */
  role: string | null;
  builtWith: string[];
  usedBy: string | null;
  period: string | null;
  /** What measurably changed. null when you genuinely don't have a figure. */
  impact: string | null;

  liveUrl: string | null;
  repoUrl: string | null;
  /** Path under /public. null renders a typographic fallback, which is fine. */
  image: string | null;
  /** Alt text. Required whenever `image` is set. */
  imageAlt: string | null;
  /** Featured projects lead the section and get the large treatment. */
  featured: boolean;
};

export type ExperienceEntry = {
  company: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  summary: string;
  highlights: string[];
  tags: string[];
  /** The one story worth reading from this role. null renders nothing. */
  highlight: { title: string; body: string } | null;
};

export type ScopeArea = {
  label: string;
  description: string;
};

export type ExpertiseGroup = {
  label: string;
  items: string[];
};

export type EducationEntry = {
  institution: string;
  qualification: string;
  period: string;
};

export type AboutContent = {
  paragraphs: string[];
  portrait: string | null;
};

/* ── Identity ───────────────────────────────────────────────────────────── */

export const identity: Identity = {
  name: 'Mark Anthony Cayanan',
  credentials: 'CLSSGB',
  role: 'Chief Operating Officer',
  disciplines: ['Process Development', 'People Leadership', 'Systems & Data'],
  location: 'Quezon City, Philippines',
  statement:
    'I run e-commerce operations, and I build the systems that run them. Twelve years from the front line to the director’s chair — standardising workflows, coaching teams, and turning scattered spreadsheets into tools people actually make decisions with.',
  siteUrl: 'https://example.com',
  availableForWork: false,
  availabilityNote: null,
};

/* ── Contact ────────────────────────────────────────────────────────────── */

export const email = 'markanthonypcayanan@gmail.com';

/**
 * Read from the environment, never written here.
 *
 * A resume goes to people you chose; a public git repository goes to everyone,
 * permanently — a number committed once stays in the history even if the line
 * is deleted later. So the number lives in .env.local (gitignored) and, once
 * the admin is set up, in the database. This file only knows where to look.
 *
 * `showPhone` is a second, independent gate: even with a number present, the
 * site does not display it until this is true.
 */
export const phone = process.env.ADMIN_PHONE ?? '';
export const showPhone: boolean = false;

export const socials: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/[username]', handle: 'Mark Anthony Cayanan' },
];

/* ── Selected work ──────────────────────────────────────────────────────── */
/*  Seven systems, sourced from your portfolio doc. Every one of these was
 *  built on Google Sheets / Excel and Google Apps Script — worth stating
 *  plainly, because building a twelve-module operations suite on Apps Script
 *  is a more interesting claim than building it on a normal web stack.       */

export const projects: Project[] = [
  {
    slug: 'ems-cashflow-portal',
    name: 'E-commerce Management System',
    tagline:
      'A twelve-module operations suite running an entire e-commerce business, built on Google Apps Script.',
    description:
      'A custom EMS built for a live e-commerce operation, with a secure role-based access structure — username, password and PIN — that lets administrators control access per page and per function. Orders and expenses are logged through the system while inventory adjusts itself in real time against predefined SOPs. Beyond daily operations it gives leadership visibility across cash flow, marketing performance and operational metrics in one place.',
    capabilities: [
      'Role-based access control down to individual pages and functions',
      'Real-time inventory adjustment driven by predefined SOPs',
      'Order, expense and receipt logging with an approval chain',
      'Accounts receivable and shipment tracking portals',
      'Operations alert tiles for pending shipments, AR and missing receipts',
      'Built-in team chat so order queries stay attached to the order',
    ],
    role: 'Solo build',
    builtWith: ['Google Sheets', 'Google Apps Script', 'HTML Service'],
    usedBy: 'Operations, finance and supply chain teams',
    period: '2025',
    impact: null, // ← e.g. "Replaced 6 separate trackers; closed month-end 3 days faster"
    liveUrl: null,
    repoUrl: null,
    image: '/projects/ems-account-receivable.png',
    imageAlt:
      'The Account Receivable Portal module of the E-commerce Management System, showing agent and brand filters over a receivables table.',
    featured: true,
  },
  {
    slug: 'recruitment-automation',
    name: 'Recruitment & Hiring Automation System',
    tagline:
      'End-to-end hiring pipeline — screening, scheduling, assessment and candidate comms — with the manual coordination removed.',
    description:
      'An end-to-end recruitment system that takes an applicant from first screening to offer without anyone manually chasing a calendar. Structured assessments and weighted scoring surface the strongest candidates against predefined criteria, interview scheduling runs through Google Calendar with Meet links generated automatically, and status changes trigger their own emails. It also handles assessment distribution and bulk communication to unsuccessful applicants, so candidates hear back consistently rather than eventually.',
    capabilities: [
      'Structured screening with weighted scoring against set criteria',
      'Interview scheduling integrated with Google Calendar',
      'Google Meet links generated and attached automatically',
      'Automated invitations, status updates and assessment distribution',
      'Applicant progress tracking across the whole pipeline',
      'Bulk, consistent communication to unsuccessful applicants',
    ],
    role: 'Solo build',
    builtWith: ['Google Sheets', 'Google Apps Script', 'Google Calendar API', 'Gmail'],
    usedBy: 'Hiring managers and interviewers',
    period: '[Year]',
    impact: null, // ← the cycle-time reduction here is your strongest possible number
    liveUrl: null,
    repoUrl: null,
    image: '/projects/recruitment-scheduling.png',
    imageAlt:
      'The interview scheduling configuration sheet, showing a three-step setup for month selection, date copying and per-date time slots.',
    featured: true,
  },
  {
    slug: 'kpi-performance-tracker',
    name: 'KPI & Performance Tracker',
    tagline:
      'Paste the raw export, get every designer’s weighted KPI score — for a Print-on-Demand team.',
    description:
      'An automated tracker for a Print-on-Demand design team that turns a raw data dump into finished KPI scores without manual calculation. Metric weights, passing scores and design points per product category are all configurable, so the scoring model can change without rebuilding the sheet. It reports productivity and quality daily, weekly and monthly, and breaks errors down by designer and by product category.',
    capabilities: [
      'Raw data dump converts to weighted KPI scores automatically',
      'Configurable metric weights, passing scores and per-category design points',
      'Two-tier scoring model for different designer levels',
      'Daily, weekly and monthly productivity and quality reporting',
      'Error breakdown by designer and by product category',
    ],
    role: 'Solo build',
    builtWith: ['Excel', 'Google Sheets'],
    usedBy: 'Print-on-Demand design team',
    period: '2023 — 2025',
    impact: null,
    liveUrl: null,
    repoUrl: null,
    image: '/projects/kpi-tracker-scores.png',
    imageAlt:
      'The KPI tracker’s scoring core, showing raw score inputs resolving into weighted tier-based final performance scores.',
    featured: false,
  },
  {
    slug: 'task-management-tracker',
    name: 'Task Management Tracker',
    tagline:
      'Task naming, prioritisation and delivery estimates, calculated rather than argued about.',
    description:
      'A task management system for a graphic design department that automates the parts teams usually negotiate by hand. Task names are generated to a convention, work is scored and prioritised automatically, and expected completion dates and times are calculated from the assigned date and the task’s own parameters. It surfaces top outputs and computes each designer’s KPI alongside the queue.',
    capabilities: [
      'Automated task naming to a fixed convention',
      'Scoring and prioritisation calculated, not assigned by hand',
      'Expected completion date and time derived from assignment parameters',
      'Top-output view across the department',
      'Per-designer KPI calculated from the same source data',
    ],
    role: 'Solo build',
    builtWith: ['Excel', 'Google Sheets'],
    usedBy: 'Graphic design department',
    period: '2023 — 2025',
    impact: null,
    liveUrl: null,
    repoUrl: null,
    image: '/projects/task-management-grid.png',
    imageAlt:
      'The task management master grid, showing auto-filled task numbers and generated task names across the department queue.',
    featured: false,
  },
  {
    slug: 'ads-metrics-report',
    name: 'Social Media Ads Metrics Report',
    tagline:
      'Bulk ad exports in, weekly per-platform comparison out — with the report written for you.',
    description:
      'A reporting tracker built for a social media management business. It takes a bulk data dump, filters by month and year, and presents a clear week-on-week comparison of every metric for each platform. The written report generates itself from the same data, so the numbers in the narrative always match the numbers in the table.',
    capabilities: [
      'Month and year filtering across the whole report',
      'Automatic computation from a bulk data dump',
      'Week-on-week comparison of each metric, per platform',
      'Report generated automatically from the underlying figures',
    ],
    role: 'Solo build',
    builtWith: ['Google Sheets'],
    usedBy: 'Social media management clients',
    period: '[Year]',
    impact: null,
    liveUrl: null,
    repoUrl: null,
    image: '/projects/ads-metrics-dashboard.png',
    imageAlt:
      'The social media ads metrics dashboard, showing per-platform navigation above a weekly metric comparison.',
    featured: false,
  },
  {
    slug: 'ads-campaign-report',
    name: 'Dynamic Ads Campaign Report',
    tagline: 'Facebook and Google campaign performance in one filtered view.',
    description:
      '[Your portfolio doc shows this system but does not describe it. Two or three sentences here on what it pulls in, what it compares, and who reads it would bring it up to the standard of the others.]',
    capabilities: [
      'Weekly and monthly data filtering',
      'Combined Facebook and Google Ads performance summary',
      '[Other capabilities worth naming]',
    ],
    role: 'Solo build',
    builtWith: ['Google Sheets'],
    usedBy: null,
    period: '[Year]',
    impact: null,
    liveUrl: null,
    repoUrl: null,
    // No screenshot: every available shot of this system shows an identifiable
    // client brand and live campaign names. See README before adding one.
    image: null,
    imageAlt: null,
    featured: false,
  },
  {
    slug: 'performance-management-system',
    name: 'Performance Management System',
    tagline:
      'A department dashboard plus a personal scorecard per employee, updating in real time.',
    description:
      'A performance management dashboard with an individual scorecard for every employee, so each person can see their own KPI score and schedule as it updates rather than finding out at review time. [Worth another sentence or two on how it is used day to day — self-service visibility is the interesting part and it is underplayed in your doc.]',
    capabilities: [
      'Main department-level performance dashboard',
      'Individual scorecard sheet per employee',
      'Real-time KPI score visible to the person it describes',
      'Schedules surfaced alongside performance',
    ],
    role: 'Solo build',
    builtWith: ['Google Sheets', 'Google Apps Script'],
    usedBy: null,
    period: '[Year]',
    impact: null,
    liveUrl: null,
    repoUrl: null,
    // No screenshot: the only available shot names an individual employee
    // alongside their scores. See README.
    image: null,
    imageAlt: null,
    featured: false,
  },
];

/* ── Experience ─────────────────────────────────────────────────────────── */

export const experience: ExperienceEntry[] = [
  {
    company: 'PVGC',
    title: 'Operations Manager → Chief Operating Officer',
    start: 'Oct 2025',
    end: 'Present',
    location: 'Quezon City, Philippines',
    summary:
      'Own day-to-day operations across teams and functions, from fulfilment and logistics through to reporting and financial coordination.',
    highlights: [
      'Led day-to-day operations across teams and functions to ensure consistent execution and service quality.',
      'Built and enforced SOPs to standardise workflows, reduce errors, and improve accountability.',
      'Managed operating cadence, performance reviews, and cross-functional alignment to hit targets.',
      'Streamlined processes and removed bottlenecks to improve turnaround times and throughput.',
      'Oversaw inventory, fulfilment, and logistics to ensure accurate orders and on-time delivery.',
      'Coordinated with vendors and partners to maintain service levels and resolve operational issues.',
      'Built and implemented tools and dashboards to improve visibility, reporting, and decision-making.',
      'Partnered with Sales and Finance to support forecasting, budgeting, and cash flow coordination.',
      'Hired, trained, and coached team leads and staff to improve performance and execution.',
      'Led operational projects and rollouts to support growth and scalability.',
    ],
    tags: ['Operations', 'SOP', 'Fulfilment', 'Hiring', 'Reporting'],
    highlight: {
      title: 'Made the company scalable, and it got cheaper to run',
      body: 'I joined a startup e-commerce company as Operations Manager with one mandate: make it possible to scale. That meant turning it into an actual organisation — processes that hold, systems people trust, data visible enough to decide on, and a culture that survives nobody watching. Operating expenditure is down **40%** while sales have risen, breaking monthly records against previous years, and the business keeps growing with fewer people. I am now ==Chief Operating Officer==.',
    },
  },
  {
    company: 'Cusmiz',
    title: 'Operations Manager — E-commerce',
    start: 'Mar 2023',
    end: 'Oct 2025',
    location: 'Shenzhen, China',
    summary:
      'Joined as the first Philippines employee and built the PH team from scratch, leading cross-functional groups across Customer Service, Print-on-Demand, and Graphic Design.',
    highlights: [
      'Joined as the first PH employee, built the PH team, and led cross-functional teams across Customer Service, Print-on-Demand, and Graphic Design to maintain daily, weekly, and monthly productivity and quality benchmarks.',
      'Developed and implemented Standard Operating Procedures to streamline workflows and enhance team efficiency.',
      'Established and tracked KPIs to monitor individual and team performance, driving accountability and continuous improvement.',
      'Designed and maintained performance tracking systems to identify trends, recognise high performers, and address underperformance proactively.',
      'Managed strategic projects by breaking high-level objectives into actionable tasks, assigning responsibilities, and ensuring timely delivery.',
      'Reported directly to shareholders on departmental performance metrics and the overall operational health of the Philippine team.',
      'Proactively identified operational challenges and implemented data-driven action plans to improve team outcomes and efficiency.',
      'Oversaw recruitment, onboarding, and HR functions to support team growth and maintain a strong organisational culture.',
    ],
    tags: ['Team building', 'KPIs', 'Print-on-Demand', 'HR', 'Stakeholder reporting'],
    highlight: {
      title: 'Built the Philippine operation from one employee',
      body: 'I was hired as the ==first Filipino employee== of a Chinese e-commerce company to build their PH team from nothing — recruitment, SOPs, processes, training, KPIs, company policies, career paths, the internal systems, and then running the whole operation. The business grew continuously and opened new units on the back of it, and they sent me to work in China to understand the company end to end. I am still friends with the owners.',
    },
  },
  {
    company: 'IntouchCX',
    title: 'Team Manager — E-commerce',
    start: 'Mar 2022',
    end: 'Mar 2023',
    location: 'Cyberpark 1, Cubao, Philippines',
    summary:
      'Managed team performance against KPIs and SLAs while developing the people behind the numbers.',
    highlights: [
      'Ensured proficient training, professional development, and employee engagement to prepare, grow, and retain employees.',
      'Managed operational performance to meet Key Performance Indicators and Service Level Agreements.',
      'Analysed reports and statistical data to measure production levels and identify root causes for underperforming areas.',
      'Used critical thinking to develop solutions that improved business performance and partner success.',
      'Motivated teams through relationship building and real-time coaching.',
      'Developed incentive programs to motivate CSRs to achieve desired outcomes.',
      'Coordinated with other departments to resolve employee issues and concerns.',
    ],
    tags: ['KPIs', 'SLAs', 'Coaching', 'Root-cause analysis'],
    highlight: {
      title: 'Gave five teams a fair share of every channel',
      body: 'Five to seven teams handled phone, chat and email with no rule for who took what, so the split felt arbitrary and caused friction between them. I built a scheduling process that forecasts daily and monthly volume per channel from historical data, then distributes the work across teams on that basis. Operations became predictable and the arguments stopped.',
    },
  },
  {
    company: 'Concentrix',
    title: 'Agent → SME → Team Leader — E-commerce',
    start: 'Dec 2013',
    end: 'Mar 2022',
    location: 'SM Cyberwest, Philippines',
    summary:
      'Eight-plus years in e-commerce, progressing from front-line agent to Subject Matter Expert to Team Leader.',
    highlights: [
      'Progressed from Agent to Subject Matter Expert to Team Leader during an 8+ year e-commerce tenure.',
    ],
    tags: ['Customer service', 'Subject matter expertise', 'Team leadership'],
    highlight: {
      title: 'Made dead air visible, and it fell',
      body: 'Silence on calls was a scored KPI for every site serving the brand, and coaching alone was not moving it. The usual advice — keep talking, ask another question — traded silence for longer handle and hold time, which are scored too, and enforcing it across hundreds of agents was harder still. So I interviewed agents to find the real cause: they were not ignoring it, they simply could not see where they stood. I built ==real-time reporting== that showed each agent their current dead air alongside the minutes they had left to spend that day and week and still pass for the month. Silence dropped sharply and the site won awards for it. So did I — **best agent company-wide in my first month**, then best SME and best team leader several times over.',
    },
  },
];

/* ── Operations scope ───────────────────────────────────────────────────── */

export const scope: ScopeArea[] = [
  {
    label: 'SOP & Process',
    description: 'Workflow standardisation, bottleneck removal, and continuous improvement.',
  },
  {
    label: 'KPI Management',
    description: 'Performance reviews, KPI tracking, accountability, and coaching.',
  },
  {
    label: 'Fulfilment',
    description: 'Inventory, order accuracy, fulfilment, logistics, and on-time delivery.',
  },
  {
    label: 'Reporting',
    description: 'Dashboards, trend analysis, operational visibility, and decision support.',
  },
  {
    label: 'People & HR',
    description: 'Hiring, onboarding, training, team leadership, and employee engagement.',
  },
  {
    label: 'Partners',
    description: 'Vendor coordination, partner service levels, and cross-functional alignment.',
  },
  {
    label: 'Finance Support',
    description: 'Forecasting, budgeting, and cash flow coordination with Sales and Finance.',
  },
  {
    label: 'Project Delivery',
    description: 'Strategic rollouts, task ownership, execution cadence, and scalability.',
  },
];

/* ── Expertise ──────────────────────────────────────────────────────────── */

export const expertise: ExpertiseGroup[] = [
  {
    label: 'Core expertise',
    items: [
      'Operations Management',
      'Leadership',
      'Process Improvement',
      'Project Management',
      'System Creation',
      'Customer Service',
      'Critical Thinking / Data Analytics',
      'Marketing',
    ],
  },
  {
    label: 'Tools & platforms',
    items: [
      'Google Apps Script',
      'Google Sheets & Excel',
      'AI tools (ChatGPT, Claude)',
      'Notion, Trello',
      'CRMs and ERP',
      'Keyword research tools',
    ],
  },
  {
    label: 'Business knowledge',
    items: [
      'Digital ads (Google, Meta, Amazon)',
      'Advertising principles',
      'Sales',
      'Creatives',
      'HR',
      'Finance',
    ],
  },
];

/* ── Education & credentials ────────────────────────────────────────────── */

export const education: EducationEntry[] = [
  {
    institution: 'STI College',
    qualification: 'BS in Computer Science',
    period: '2008 — 2013',
  },
];

export const certifications: string[] = [
  'Certified Lean Six Sigma Green Belt (CLSSGB)',
];

export const languages: string[] = ['English', 'Filipino'];

/* ── About ──────────────────────────────────────────────────────────────── */

export const about: AboutContent = {
  paragraphs: [
    'I started on the front line of e-commerce customer service in 2013 and spent the next decade working up through subject-matter expertise, team leadership and operations management to running operations as a director. The through-line has been the same at every level: find the part of the process that is quietly costing everyone time, and fix it properly.',
    'The computer science degree behind the operations career is why I build my own tools instead of waiting for someone to buy one. Most of what I have shipped runs on Google Sheets and Apps Script — unglamorous, but it means the system arrives the week the problem does, and it fits the process the team already has rather than the process a vendor assumed.',
    '[Optional third paragraph: something human. What you do when you are not working. Worth including — the rest of this page is deliberately dry, and one warm paragraph at the end does a lot.]',
  ],
  portrait: null,
};

/* ── Navigation ─────────────────────────────────────────────────────────── */

export const navigation = [
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'scope', label: 'Scope' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const;

/* ── Derived helpers ────────────────────────────────────────────────────── */

export const orderedProjects: Project[] = [
  ...projects.filter((p) => p.featured),
  ...projects.filter((p) => !p.featured),
];

/**
 * When the e-commerce career actually began — Concentrix, December 2013.
 *
 * The month matters. Subtracting bare years overstates the figure by up to a
 * full year every January: on 1 Jan 2026 a year-only calculation claimed 13
 * years when the true elapsed span was 12. `yearsOfExperience()` in
 * lib/career.ts does the month-aware arithmetic — use it rather than
 * recomputing from the year.
 */
export type VideoItem = { title: string; caption: string | null; url: string };

/** YouTube or Vimeo links, shown in the Video section. Empty by default — the
 *  section hides itself until you add one. Edit these in the admin. */
export const videos: VideoItem[] = [];

export const careerStartYear = 2013;
export const careerStartMonth = 12;

export const allTechnologies: string[] = Array.from(
  new Set([...projects.flatMap((p) => p.builtWith), ...expertise.flatMap((g) => g.items)]),
).filter((t) => !t.startsWith('['));
