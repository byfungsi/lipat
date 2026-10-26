import { freezeDocument } from "@lipat-internal/model";
import type { DeckInput, LipatResult } from "@lipat-internal/model";
import { audienceTemplates } from "./audience-templates";
import { businessTemplates } from "./business-templates";
import { knowledgeTemplates } from "./knowledge-templates";
import { industryTemplates } from "./industry-templates";
import { createTemplatePhoto } from "./template-photography.generated";
import { templateArtDirections } from "./template-art-direction";
import { createTemplateSlide } from "./template-layout";
import type {
  PresentationTemplateInfo,
  PresentationTemplateOptions,
} from "./template-types";

const recipes = [
  ...businessTemplates,
  ...knowledgeTemplates,
  ...industryTemplates,
  ...audienceTemplates,
];

/** Sixty original six-slide deck templates; catalog metadata can be listed without initializing WASM. */
export const presentationTemplates: readonly PresentationTemplateInfo[] =
  freezeDocument(
    recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      domain: recipe.domain,
      category: recipe.category,
      description: recipe.description,
      palette: recipe.palette,
      slideCount: 6 as const,
      slideTitles: recipe.slides.map((slide, index) =>
        index === 0
          ? (
              templateArtDirections.find(
                (direction) => direction.templateId === recipe.id,
              )?.title ?? slide.title
            ).replace(/\n/g, " ")
          : slide.title,
      ),
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
  const direction = templateArtDirections.find(
    (direction) => direction.templateId === found.id,
  );
  if (!direction)
    return {
      ok: false,
      error: {
        reason: "invalidTemplate",
        message: `Missing art direction: ${found.id}`,
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
  const [background, foreground, accent] = recipe.palette;
  const slides = recipe.slides.map((slide, index) =>
    createTemplateSlide(
      recipe,
      index === 0
        ? {
            ...slide,
            title: options.title ?? direction.title,
            body: direction.subtitle,
          }
        : slide,
      index,
      options.organization ?? "Your organization",
      direction,
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
        createTemplatePhoto(direction.photo),
        ...(direction.detailPhoto
          ? [createTemplatePhoto(direction.detailPhoto)]
          : []),
      ],
      slides,
    },
  };
}
