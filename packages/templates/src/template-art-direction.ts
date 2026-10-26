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

/** Short display headlines and image compositions establish the visual voice of all thirty templates. */
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
];
