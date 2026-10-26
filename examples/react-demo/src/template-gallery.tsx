import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { DeckInput, LipatEngine, SlideScene } from "@byfungsi/lipat";
import {
  createPresentationTemplate,
  presentationTemplates,
  presentationTemplateCategories,
} from "@byfungsi/lipat/templates";
import type {
  PresentationTemplateInfo,
  PresentationTemplateCategory,
} from "@byfungsi/lipat/templates";
import { ScenePlayer } from "@byfungsi/lipat/react";
import "./template-gallery.css";

/** Playground template gallery previews complete decks and supplies ordinary editable source to the host. */
export default function TemplateGallery({
  engine,
  onUse,
  onClose,
}: {
  readonly engine: LipatEngine;
  readonly onUse: (id: string, input: DeckInput) => void;
  readonly onClose: () => void;
}): ReactNode {
  const [category, setCategory] = useState<
    PresentationTemplateCategory | "all"
  >("all");
  const [search, setSearch] = useState(""),
    [error, setError] = useState("");
  const [selected, setSelected] = useState<{
    readonly info: PresentationTemplateInfo;
    readonly input: DeckInput;
    readonly scene: SlideScene;
  } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const filtered = presentationTemplates.filter(
    (t) =>
      (category === "all" || t.category === category) &&
      `${t.name} ${t.domain} ${t.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  const useTemplate = (info: PresentationTemplateInfo) => {
    const result = createPresentationTemplate(info.id);
    if (result.ok) onUse(info.id, result.value);
    else setError(result.error.message);
  };
  const preview = (info: PresentationTemplateInfo) => {
    const input = createPresentationTemplate(info.id);
    if (!input.ok) {
      setError(input.error.message);
      return;
    }
    const document = engine.parseDocument(input.value);
    if (!document.ok) {
      setError(document.error.message);
      return;
    }
    const compiled = engine.compile(document.value);
    if (!compiled.ok) {
      setError(compiled.error.message);
      return;
    }
    setSelected({ info, input: input.value, scene: compiled.value.scene });
  };
  return (
    <main className="template-gallery">
      <div className="gallery-top">
        <button className="gallery-back" onClick={onClose}>
          ← Back to the studio
        </button>
        <a className="gallery-brand" href="?sample=templates">
          lipat / templates
        </a>
      </div>
      <header className="gallery-heading">
        <div>
          <p className="eyebrow">A STRONGER STARTING POINT</p>
          <h1>Make room for a good story.</h1>
          <p>
            60 original decks. Six considered slides each. Ready to make your
            own.
          </p>
        </div>
        <label>
          Find your starting point
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Try lab report, tech talk, campaign…"
          />
        </label>
      </header>
      <nav className="gallery-categories" aria-label="Template categories">
        <button
          type="button"
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          All templates <span>{presentationTemplates.length}</span>
        </button>
        {presentationTemplateCategories.map((group) => (
          <button
            type="button"
            key={group.id}
            aria-pressed={category === group.id}
            onClick={() => setCategory(group.id)}
          >
            {group.label}{" "}
            <span>
              {
                presentationTemplates.filter(
                  (template) => template.category === group.id,
                ).length
              }
            </span>
          </button>
        ))}
      </nav>
      <div className="gallery-meta">
        <span>
          {filtered.length} complete{" "}
          {filtered.length === 1 ? "template" : "templates"}
        </span>
        <span>
          Editable text and charts · AI-generated illustrative photography
        </span>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <div className="template-grid">
        {filtered.map((info) => (
          <article
            className="template-card"
            key={info.id}
            data-category={info.category}
          >
            <button
              className="template-cover"
              aria-label={`Preview ${info.name}`}
              onClick={() => preview(info)}
            >
              <img
                loading="lazy"
                src={`templates/${info.id}/cover.svg`}
                alt={`${info.name} cover`}
                width={1280}
                height={720}
              />
              <span>Preview all 6 slides ↗</span>
            </button>
            <div className="template-card-body">
              <div className="template-card-label">
                <span>{info.domain}</span>
                <span>06 slides</span>
              </div>
              <h2>{info.name}</h2>
              <p>{info.description}</p>
              <div className="template-card-bottom">
                <div className="template-palette" aria-label="Template palette">
                  {info.palette.map((color) => (
                    <span
                      key={color}
                      style={{ background: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div>
                  <a
                    href={`templates/${info.id}/deck.pptx`}
                    download={`${info.id}.pptx`}
                  >
                    PPTX ↓
                  </a>
                  <button onClick={() => useTemplate(info)}>
                    Use template →
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="gallery-empty">
          No matches yet. Try a different search or category.
        </p>
      ) : null}
      <footer className="gallery-footer">
        Original compositions and artwork. All figures, organizations and
        quotations are illustrative; replace and verify them before use.
      </footer>
      <dialog
        ref={dialog}
        className="template-preview-dialog"
        onClose={() => setSelected(null)}
        onCancel={() => setSelected(null)}
        aria-labelledby="template-preview-title"
      >
        {selected ? (
          <>
            <div className="template-preview-heading">
              <div>
                <p className="eyebrow">{selected.info.domain}</p>
                <h2 id="template-preview-title">{selected.info.name}</h2>
              </div>
              <button
                autoFocus
                aria-label="Close template preview"
                onClick={() => dialog.current?.close()}
              >
                ×
              </button>
            </div>
            <ScenePlayer scene={selected.scene} imagePolicy="embedded-only" />
            <div className="template-preview-actions">
              <p>
                All six slides, fully editable. Sample content is illustrative.
              </p>
              <button
                onClick={() => {
                  dialog.current?.close();
                  onUse(selected.info.id, selected.input);
                }}
              >
                Use this template →
              </button>
            </div>
          </>
        ) : null}
      </dialog>
    </main>
  );
}
