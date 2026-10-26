/** Photograph subjects are original generated editorial assets, never evidence of a real project. */
export type TemplatePhotoKey =
  | "architecture-detail"
  | "hospitality-detail"
  | "culinary-detail"
  | "architecture"
  | "hospitality"
  | "culinary"
  | "climate"
  | "community"
  | "product"
  | "research"
  | "creative"
  | "city"
  | "textile"
  | "logistics"
  | "technology";

/** Each deck has an explicit photographic and typographic composition rather than a palette-only identity. */
export interface TemplateArtDirection {
  readonly templateId: string;
  readonly photo: TemplatePhotoKey;
  readonly detailPhoto?: TemplatePhotoKey;
  readonly cover:
    "editorial" | "panorama" | "gallery" | "poster" | "window" | "masthead";
  readonly title: string;
  readonly subtitle: string;
}

/** Short display headlines and image compositions establish the visual voice of all sixty templates. */
export const templateArtDirections: readonly TemplateArtDirection[] = [
  {
    templateId: "venture-signal",
    photo: "product",
    cover: "window",
    title: "Build what\ncomes next.",
    subtitle: "A focused idea. A useful product. A venture worth building.",
  },
  {
    templateId: "boardroom-brief",
    photo: "city",
    cover: "gallery",
    title: "The next\nchapter.",
    subtitle: "The decisions that shape a stronger business.",
  },
  {
    templateId: "revenue-pulse",
    photo: "city",
    cover: "masthead",
    title: "Growth,\nwith intent.",
    subtitle: "A quarterly review of momentum, focus and the next opportunity.",
  },
  {
    templateId: "product-horizon",
    photo: "product",
    cover: "editorial",
    title: "A clearer\nhorizon.",
    subtitle: "A product direction built around what people need next.",
  },
  {
    templateId: "launch-studio",
    photo: "product",
    cover: "poster",
    title: "Meet your\nnext favorite.",
    subtitle: "Thoughtful by design. Useful every day.",
  },
  {
    templateId: "strategy-compass",
    photo: "climate",
    cover: "panorama",
    title: "Choose the\nway forward.",
    subtitle: "Clear choices today. Meaningful progress tomorrow.",
  },
  {
    templateId: "client-proposal",
    photo: "architecture",
    detailPhoto: "architecture-detail",
    cover: "gallery",
    title: "Good work.\nBuilt together.",
    subtitle: "A considered approach to your next ambitious project.",
  },
  {
    templateId: "campaign-spectrum",
    photo: "creative",
    cover: "poster",
    title: "Make them\nfeel something.",
    subtitle: "One powerful idea, expressed across every moment that matters.",
  },
  {
    templateId: "brand-manifesto",
    photo: "textile",
    cover: "masthead",
    title: "A point\nof view.",
    subtitle:
      "The beliefs, character and details that make a brand unmistakable.",
  },
  {
    templateId: "research-lens",
    photo: "community",
    cover: "editorial",
    title: "Listen\ncloser.",
    subtitle: "Human observations. Clearer questions. Better decisions.",
  },
  {
    templateId: "academic-defense",
    photo: "research",
    cover: "gallery",
    title: "Ask.\nExplore.\nDiscover.",
    subtitle: "A research story from the first question to the next discovery.",
  },
  {
    templateId: "lesson-spark",
    photo: "creative",
    cover: "window",
    title: "A little\nwonder.",
    subtitle: "An invitation to notice, question and try something new.",
  },
  {
    templateId: "workshop-canvas",
    photo: "community",
    cover: "panorama",
    title: "Room to\nthink bigger.",
    subtitle:
      "A practical session for fresh perspectives and shared decisions.",
  },
  {
    templateId: "onboarding-path",
    photo: "community",
    cover: "editorial",
    title: "Start with\npossibility.",
    subtitle: "Your people, your purpose and a confident first month.",
  },
  {
    templateId: "clinical-evidence",
    photo: "research",
    cover: "masthead",
    title: "Evidence,\nwith clarity.",
    subtitle: "A careful look at the question, the findings and their limits.",
  },
  {
    templateId: "public-health",
    photo: "community",
    cover: "gallery",
    title: "Care, closer\nto home.",
    subtitle:
      "Understanding the barriers. Designing a more accessible response.",
  },
  {
    templateId: "climate-ledger",
    photo: "climate",
    cover: "poster",
    title: "A lighter\nfootprint.",
    subtitle: "A measured approach to a more responsible future.",
  },
  {
    templateId: "nonprofit-impact",
    photo: "community",
    cover: "window",
    title: "More\npossibility.",
    subtitle: "Local relationships. Practical support. Lasting opportunity.",
  },
  {
    templateId: "civic-plan",
    photo: "city",
    cover: "panorama",
    title: "A better\neveryday.",
    subtitle: "A public service shaped around the people who use it.",
  },
  {
    templateId: "architecture-atelier",
    photo: "architecture",
    detailPhoto: "architecture-detail",
    cover: "editorial",
    title: "Space.\nLight.\nPossibility.",
    subtitle: "A study in proportion, material and the way we live.",
  },
  {
    templateId: "property-portfolio",
    photo: "architecture",
    detailPhoto: "architecture-detail",
    cover: "panorama",
    title: "A place\nto belong.",
    subtitle: "A considered property story, from setting to long-term value.",
  },
  {
    templateId: "hospitality-journey",
    photo: "hospitality",
    detailPhoto: "hospitality-detail",
    cover: "poster",
    title: "Stay a\nlittle longer.",
    subtitle: "A guest experience designed around the art of feeling at home.",
  },
  {
    templateId: "culinary-story",
    photo: "culinary",
    detailPhoto: "culinary-detail",
    cover: "gallery",
    title: "A taste\nof place.",
    subtitle:
      "Seasonal ingredients. A generous table. A distinctive point of view.",
  },
  {
    templateId: "retail-season",
    photo: "textile",
    cover: "masthead",
    title: "A new\nperspective.",
    subtitle:
      "A seasonal collection shaped by texture, color and everyday life.",
  },
  {
    templateId: "supply-chain",
    photo: "logistics",
    cover: "panorama",
    title: "Keep the\nworld moving.",
    subtitle: "A clearer view of flow, resilience and operational opportunity.",
  },
  {
    templateId: "finance-outlook",
    photo: "city",
    cover: "editorial",
    title: "See the\nnext move.",
    subtitle:
      "A financial outlook grounded in evidence and explicit assumptions.",
  },
  {
    templateId: "security-brief",
    photo: "technology",
    cover: "window",
    title: "Confidence,\nby design.",
    subtitle: "Clear priorities for a more resilient digital business.",
  },
  {
    templateId: "developer-keynote",
    photo: "technology",
    cover: "masthead",
    title: "Build\nbeyond.",
    subtitle: "Better primitives. Fewer boundaries. More room to create.",
  },
  {
    templateId: "creative-portfolio",
    photo: "creative",
    cover: "gallery",
    title: "Form.\nFeeling.\nFunction.",
    subtitle: "Selected ideas at the intersection of clarity and character.",
  },
  {
    templateId: "event-program",
    photo: "creative",
    cover: "poster",
    title: "Good minds.\nGreat ideas.",
    subtitle: "A gathering for curious people and conversations that continue.",
  },
  {
    templateId: "course-project",
    photo: "creative",
    cover: "window",
    title: "An idea.\nMade real.",
    subtitle:
      "A clear project story: the question, the work, the result and what you learned.",
  },
  {
    templateId: "literature-seminar",
    photo: "textile",
    cover: "gallery",
    title: "Read between\nthe lines.",
    subtitle:
      "Build a thoughtful interpretation through a claim, close reading and a competing view.",
  },
  {
    templateId: "lab-report",
    photo: "research",
    cover: "masthead",
    title: "Observe.\nMeasure. Learn.",
    subtitle: "A hypothesis. A method. Evidence you can explain.",
  },
  {
    templateId: "capstone-showcase",
    photo: "product",
    cover: "poster",
    title: "Built to\nbe useful.",
    subtitle:
      "Show the problem, prototype, evaluation and learning behind a student-built solution.",
  },
  {
    templateId: "study-group",
    photo: "community",
    cover: "panorama",
    title: "Learn it.\nTogether.",
    subtitle:
      "Run a peer-led study session with retrieval practice, worked examples and reflection.",
  },
  {
    templateId: "debate-case",
    photo: "city",
    cover: "editorial",
    title: "Make a case.\nHear another.",
    subtitle:
      "Build an evidence-led debate with a clear motion, warrants, rebuttals and weighing.",
  },
  {
    templateId: "internship-reflection",
    photo: "community",
    cover: "window",
    title: "Work. Learn.\nFind your way.",
    subtitle:
      "Reflect on an internship through a contribution, a challenge and a concrete growth plan.",
  },
  {
    templateId: "scholarship-story",
    photo: "architecture",
    cover: "gallery",
    title: "A path\nwith purpose.",
    subtitle:
      "Connect a personal motivation, demonstrated effort and a realistic plan for further study.",
  },
  {
    templateId: "research-proposal",
    photo: "research",
    cover: "editorial",
    title: "A question\nworth testing.",
    subtitle:
      "Move from a research gap to a feasible study with clear measures, risks and milestones.",
  },
  {
    templateId: "literature-map",
    photo: "textile",
    cover: "masthead",
    title: "Find the\nmissing thread.",
    subtitle: "Themes, tensions and the question still unanswered.",
  },
  {
    templateId: "methods-protocol",
    photo: "research",
    cover: "gallery",
    title: "Make the\nmethod clear.",
    subtitle:
      "Explain a reproducible protocol with sampling, measures, procedure and decision rules.",
  },
  {
    templateId: "conference-paper",
    photo: "research",
    cover: "window",
    title: "One finding.\nA new question.",
    subtitle:
      "Present a paper as a focused argument with one result, its interpretation and its limits.",
  },
  {
    templateId: "poster-pitch",
    photo: "creative",
    cover: "poster",
    title: "One study.\nThree minutes.",
    subtitle:
      "Turn a research poster into a short spoken walkthrough that invites a useful conversation.",
  },
  {
    templateId: "replication-report",
    photo: "research",
    cover: "masthead",
    title: "Test it\nagain.",
    subtitle: "The same question. A new test. A careful comparison.",
  },
  {
    templateId: "fieldwork-journal",
    photo: "community",
    cover: "panorama",
    title: "Notice what\nchanges.",
    subtitle:
      "Share field observations, emerging interpretations and reflexive questions during qualitative research.",
  },
  {
    templateId: "grant-case",
    photo: "climate",
    cover: "editorial",
    title: "A focused\ncontribution.",
    subtitle:
      "Explain why a research project matters, how it will work and what the requested support enables.",
  },
  {
    templateId: "tech-lightning",
    photo: "technology",
    cover: "poster",
    title: "One idea.\nFive minutes.",
    subtitle:
      "Deliver a short technical talk with a sharp problem, one example and a memorable takeaway.",
  },
  {
    templateId: "architecture-deep-dive",
    photo: "technology",
    cover: "editorial",
    title: "Follow\nthe boundaries.",
    subtitle:
      "Explain a system through its responsibilities, data flow, tradeoffs and failure paths.",
  },
  {
    templateId: "live-demo",
    photo: "product",
    cover: "window",
    title: "Show the\nworking thing.",
    subtitle:
      "Structure a reliable live demo around one task, visible results and a prepared recovery path.",
  },
  {
    templateId: "open-source-story",
    photo: "community",
    cover: "panorama",
    title: "Build it.\nShare the craft.",
    subtitle:
      "Introduce an open source project through its purpose, design and approachable contribution path.",
  },
  {
    templateId: "performance-lab",
    photo: "technology",
    cover: "masthead",
    title: "Measure\nbefore guessing.",
    subtitle: "One workload. A clear baseline. A useful experiment.",
  },
  {
    templateId: "incident-learning",
    photo: "city",
    cover: "gallery",
    title: "Understand.\nImprove.",
    subtitle:
      "Explain an incident through impact, timeline, contributing conditions and verifiable actions.",
  },
  {
    templateId: "api-workshop",
    photo: "creative",
    cover: "window",
    title: "Learn by\nbuilding.",
    subtitle:
      "Guide a hands-on session from a minimal API call to validation, errors and a working extension.",
  },
  {
    templateId: "migration-journey",
    photo: "logistics",
    cover: "panorama",
    title: "Move with\na clear plan.",
    subtitle:
      "Explain a migration through its constraints, staged rollout, verification and rollback decisions.",
  },
  {
    templateId: "positioning-story",
    photo: "product",
    cover: "editorial",
    title: "A place\nin their mind.",
    subtitle:
      "Define the audience, alternatives, distinctive value and proof behind a positioning choice.",
  },
  {
    templateId: "audience-insights",
    photo: "community",
    cover: "gallery",
    title: "Know who\nyou are for.",
    subtitle:
      "Turn audience research into useful segments, motivations and messaging hypotheses.",
  },
  {
    templateId: "content-calendar",
    photo: "textile",
    cover: "masthead",
    title: "A story\nwith rhythm.",
    subtitle: "A useful idea, expressed with a consistent rhythm.",
  },
  {
    templateId: "social-experiment",
    photo: "creative",
    cover: "poster",
    title: "Test the\ncreative idea.",
    subtitle:
      "Frame a social content experiment with a hypothesis, controlled variation and useful interpretation.",
  },
  {
    templateId: "brand-partnership",
    photo: "hospitality",
    cover: "gallery",
    title: "Better\ntogether.",
    subtitle:
      "Propose a partnership around audience fit, a shared experience and clear responsibilities.",
  },
  {
    templateId: "campaign-retrospective",
    photo: "creative",
    cover: "window",
    title: "What worked.\nWhat comes next.",
    subtitle:
      "Review a campaign against its objective, channel evidence, creative lessons and next decisions.",
  },
];
