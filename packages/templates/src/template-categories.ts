/** Stable audience categories for catalog filters and host navigation. */
export type PresentationTemplateCategory =
  | "education"
  | "research"
  | "technology"
  | "marketing"
  | "business"
  | "industry";

/** Human-readable category metadata; counts derive from the current catalog. */
export const presentationTemplateCategories: readonly {
  readonly id: PresentationTemplateCategory;
  readonly label: string;
  readonly description: string;
}[] = Object.freeze(
  (
    [
      {
        id: "education",
        label: "Students & learning",
        description: "Coursework, study, teaching and personal development.",
      },
      {
        id: "research",
        label: "Research",
        description:
          "Proposals, methods, evidence and scholarly conversations.",
      },
      {
        id: "technology",
        label: "Tech talks",
        description: "Technical explanations, demonstrations and workshops.",
      },
      {
        id: "marketing",
        label: "Marketing & creative",
        description: "Audiences, brands, campaigns and creative work.",
      },
      {
        id: "business",
        label: "Business",
        description: "Strategy, decisions, performance and proposals.",
      },
      {
        id: "industry",
        label: "Industry & impact",
        description: "Places, services, operations and public benefit.",
      },
    ] satisfies readonly {
      id: PresentationTemplateCategory;
      label: string;
      description: string;
    }[]
  ).map((category) => Object.freeze(category)),
);
