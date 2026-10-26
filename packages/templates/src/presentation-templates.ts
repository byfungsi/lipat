import { freezeDocument } from "@lipat-internal/model";
import type { DeckInput, LipatResult } from "@lipat-internal/model";
import { businessTemplates } from "./business-templates";
import { knowledgeTemplates } from "./knowledge-templates";
import { industryTemplates } from "./industry-templates";
import { createTemplateArtwork } from "./template-artwork";
import { createTemplateSlide } from "./template-layout";
import type {
  PresentationTemplateInfo,
  PresentationTemplateOptions,
} from "./template-types";

const recipes = [
  ...businessTemplates,
  ...knowledgeTemplates,
  ...industryTemplates,
];

/** Thirty original six-slide deck templates; catalog metadata can be listed without initializing WASM. */
export const presentationTemplates: readonly PresentationTemplateInfo[] =
  freezeDocument(
    recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      domain: recipe.domain,
      description: recipe.description,
      palette: recipe.palette,
      slideCount: 6 as const,
      slideTitles: recipe.slides.map((slide) => slide.title),
    })),
  );

/** Create a fresh, offline-complete editable template deck; unknown IDs return invalidTemplate. Compile with an explicit engine before export. */
export function createPresentationTemplate(
  templateId: string,
  options: PresentationTemplateOptions = {},
): LipatResult<DeckInput> {
  const found = recipes.find((recipe) => recipe.id === templateId);
  if (!found)
    return {
      ok: false,
      error: {
        reason: "invalidTemplate",
        message: `Presentation template does not exist: ${templateId}`,
      },
    };
  const id = options.id ?? found.id;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(id))
    return {
      ok: false,
      error: {
        reason: "invalidTemplate",
        message:
          "Presentation template identity must be a 1–128 character ASCII slug (letters, digits, dot, underscore or hyphen)",
      },
    };
  const recipe = { ...found, id };
  const [background, foreground, accent, secondary] = recipe.palette;
  const slides = recipe.slides.map((slide, index) =>
    createTemplateSlide(
      recipe,
      index === 0 && options.title !== undefined
        ? { ...slide, title: options.title }
        : slide,
      index,
      options.organization ?? "Your organization",
    ),
  );
  return {
    ok: true,
    value: {
      version: 1,
      id,
      title: options.title ?? recipe.name,
      size: { width: 1280, height: 720 },
      theme: {
        fontFamily: "Arial",
        fontSize: 26,
        headingSize: 44,
        foreground,
        background,
        accent,
        padding: 64,
        gap: 24,
      },
      assets: [
        createTemplateArtwork(
          recipe.motif,
          recipe.cover === "split" ? foreground : accent,
          secondary,
          foreground,
        ),
      ],
      slides,
    },
  };
}
