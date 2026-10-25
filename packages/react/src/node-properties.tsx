import { useState } from "react";
import type { ReactNode } from "react";
import { findSlideNode } from "@lipat-internal/core";
import { getNodeText } from "@lipat-internal/model";
import type {
  DeckOperation,
  ElementFrame,
  EntranceAnimation,
  LipatError,
  SlideNode,
  TextRun,
} from "@lipat-internal/model";
import {
  useDeck,
  useDeckReadOnly,
  useDeckScene,
  useDeckState,
} from "./deck-context";
function choice<const T extends string>(
  choices: readonly T[],
  value: string,
  fallback: T,
): T {
  return choices.find((item) => item === value) ?? fallback;
}
function PropertyForm({
  node,
  frame,
  onError,
}: {
  readonly node: SlideNode;
  readonly frame: ElementFrame;
  readonly onError?: (error: LipatError) => void;
}): ReactNode {
  const deck = useDeck(),
    state = useDeckState();
  const [text, setText] = useState(getNodeText(node));
  const [runs, setRuns] = useState<readonly TextRun[]>(
    "text" in node && typeof node.text !== "string"
      ? node.text
      : [{ text: getNodeText(node) }],
  );
  const [rich, setRich] = useState(
    "text" in node && typeof node.text !== "string",
  );
  const [style, setStyle] = useState(node.style ?? {});
  const [bounds, setBounds] = useState(frame);
  const [effect, setEffect] = useState<EntranceAnimation["effect"] | "none">(
    node.animation?.effect ?? "none",
  );
  const [duration, setDuration] = useState(node.animation?.durationMs ?? 350),
    [delay, setDelay] = useState(node.animation?.delayMs ?? 0),
    [easing, setEasing] = useState<NonNullable<EntranceAnimation["easing"]>>(
      node.animation?.easing ?? "easeOut",
    ),
    [step, setStep] = useState(node.step ?? 0);
  const [geometry, setGeometry] = useState(
      node.type === "shape" ? (node.geometry ?? "rect") : "rect",
    ),
    [fill, setFill] = useState(node.type === "shape" ? (node.fill ?? "") : ""),
    [stroke, setStroke] = useState(
      node.type === "shape" ? (node.stroke ?? "") : "",
    );
  const [fit, setFit] = useState(
      node.type === "image" ? (node.fit ?? "contain") : "contain",
    ),
    [alt, setAlt] = useState(node.type === "image" ? (node.alt ?? "") : "");
  const [ordered, setOrdered] = useState(
    node.type === "list" ? (node.ordered ?? false) : false,
  );
  const [columns, setColumns] = useState(
      node.type === "table" ? node.columns.join("\t") : "",
    ),
    [rows, setRows] = useState(
      node.type === "table"
        ? node.rows.map((row) => row.join("\t")).join("\n")
        : "",
    );
  const [layout, setLayout] = useState<"stack" | "row" | "grid" | "canvas">(
      "children" in node ? node.type : "canvas",
    ),
    [gap, setGap] = useState("gap" in node ? (node.gap ?? 16) : 16),
    [gridColumns, setGridColumns] = useState(
      node.type === "grid" ? node.columns : 2,
    );
  const [language, setLanguage] = useState(
    node.type === "code" ? (node.language ?? "text") : "text",
  );
  const [level, setLevel] = useState(
    node.type === "heading" ? (node.level ?? 1) : 1,
  );
  const updateRun = (index: number, run: TextRun) =>
    setRuns(runs.map((item, i) => (i === index ? run : item)));
  return (
    <form
      className="lipat-property-form"
      onSubmit={(event) => {
        event.preventDefault();
        let updated: SlideNode = { ...node, style };
        if (node.type === "heading" || node.type === "text")
          updated = {
            ...node,
            style,
            text: rich ? runs : text,
            ...(node.type === "heading" ? { level } : {}),
          };
        else if (node.type === "code")
          updated = { ...node, style, text, language };
        else if (node.type === "list")
          updated = { ...node, style, items: text.split("\n"), ordered };
        else if (node.type === "table")
          updated = {
            ...node,
            style,
            columns: columns.split("\t"),
            rows: rows.split("\n").map((row) => row.split("\t")),
          };
        else if (node.type === "shape")
          updated = {
            ...node,
            style,
            geometry,
            fill: fill || null,
            stroke: stroke || null,
          };
        else if (node.type === "image") updated = { ...node, style, fit, alt };
        else if ("children" in node)
          updated =
            layout === "grid"
              ? {
                  ...node,
                  type: layout,
                  style,
                  children: node.children,
                  columns: gridColumns,
                  gap,
                }
              : layout === "canvas"
                ? { ...node, type: layout, style, children: node.children }
                : {
                    ...node,
                    type: layout,
                    style,
                    children: node.children,
                    gap,
                  };
        const moved = JSON.stringify(bounds) !== JSON.stringify(frame);
        if (moved) updated = { ...updated, frame: bounds };
        const operations: DeckOperation[] = [
          { type: "replaceNode", nodeId: node.id, node: updated },
          { type: "setStep", nodeId: node.id, step: step === 0 ? null : step },
          {
            type: "setAnimation",
            nodeId: node.id,
            animation:
              effect === "none"
                ? null
                : { effect, durationMs: duration, delayMs: delay, easing },
          },
        ];
        const result =
          moved && !("children" in node)
            ? deck.applyToCanvas(state.activeSlideId, operations)
            : deck.apply(operations);
        if (!result.ok) onError?.(result.error);
      }}
    >
      {node.type === "heading" ||
      node.type === "text" ||
      node.type === "code" ||
      node.type === "list" ? (
        <>
          <label>
            Text
            <textarea
              aria-label="Selected text"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          {node.type === "list" ? (
            <label>
              <input
                type="checkbox"
                checked={ordered}
                onChange={(event) => setOrdered(event.target.checked)}
              />
              Numbered list
            </label>
          ) : null}
          {node.type === "text" || node.type === "heading" ? (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={rich}
                  onChange={(event) => {
                    setRich(event.target.checked);
                    if (event.target.checked && runs.length === 1)
                      setRuns([{ text }]);
                  }}
                />
                Rich text runs
              </label>
              {rich ? (
                <div>
                  {runs.map((run, index) => (
                    <fieldset key={index}>
                      <legend>Run {index + 1}</legend>
                      <input
                        aria-label={`Run ${index + 1} text`}
                        value={run.text}
                        onChange={(event) =>
                          updateRun(index, { ...run, text: event.target.value })
                        }
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={run.style?.bold ?? false}
                          onChange={(event) =>
                            updateRun(index, {
                              ...run,
                              style: {
                                ...run.style,
                                bold: event.target.checked,
                              },
                            })
                          }
                        />
                        Bold run
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={run.style?.italic ?? false}
                          onChange={(event) =>
                            updateRun(index, {
                              ...run,
                              style: {
                                ...run.style,
                                italic: event.target.checked,
                              },
                            })
                          }
                        />
                        Italic run
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={run.style?.underline ?? false}
                          onChange={(event) =>
                            updateRun(index, {
                              ...run,
                              style: {
                                ...run.style,
                                underline: event.target.checked,
                              },
                            })
                          }
                        />
                        Underline run
                      </label>
                      <label>
                        Run font family
                        <input
                          value={run.style?.fontFamily ?? ""}
                          placeholder="Inherited"
                          onChange={(event) =>
                            updateRun(index, {
                              ...run,
                              style: {
                                ...run.style,
                                fontFamily: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <label>
                        Run font size
                        <input
                          type="number"
                          min={1}
                          max={4000}
                          value={run.style?.fontSize ?? ""}
                          placeholder="Inherited"
                          onChange={(event) => {
                            const { fontSize: _, ...rest } = run.style ?? {};
                            updateRun(index, {
                              ...run,
                              style: event.target.value
                                ? {
                                    ...run.style,
                                    fontSize: Number(event.target.value),
                                  }
                                : rest,
                            });
                          }}
                        />
                      </label>
                      <label>
                        Run alignment
                        <select
                          value={run.style?.align ?? "left"}
                          onChange={(event) =>
                            updateRun(index, {
                              ...run,
                              style: {
                                ...run.style,
                                align: choice(
                                  ["left", "center", "right", "justify"],
                                  event.target.value,
                                  "left",
                                ),
                              },
                            })
                          }
                        >
                          {["left", "center", "right", "justify"].map(
                            (value) => (
                              <option key={value}>{value}</option>
                            ),
                          )}
                        </select>
                      </label>
                      <label>
                        Run color
                        <input
                          type="color"
                          value={run.style?.color ?? style.color ?? "#172033"}
                          onChange={(event) =>
                            updateRun(index, {
                              ...run,
                              style: {
                                ...run.style,
                                color: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        disabled={runs.length === 1}
                        onClick={() =>
                          setRuns(runs.filter((_, i) => i !== index))
                        }
                      >
                        Remove run {index + 1}
                      </button>
                    </fieldset>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRuns([...runs, { text: "New run" }])}
                  >
                    Add text run
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
      {node.type === "heading" ? (
        <label>
          Heading level
          <input
            type="number"
            min={1}
            max={6}
            value={level}
            onChange={(event) => setLevel(Number(event.target.value))}
          />
        </label>
      ) : null}
      {node.type === "code" ? (
        <label>
          Code language
          <input
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          />
        </label>
      ) : null}
      {node.type === "table" ? (
        <>
          <label>
            Table columns (tab separated)
            <textarea
              aria-label="Table columns"
              value={columns}
              onChange={(event) => setColumns(event.target.value)}
            />
          </label>
          <label>
            Table rows (tabs and new lines)
            <textarea
              aria-label="Table rows"
              value={rows}
              onChange={(event) => setRows(event.target.value)}
            />
          </label>
        </>
      ) : null}
      {node.type === "shape" ? (
        <fieldset>
          <legend>Shape</legend>
          <label>
            Geometry
            <select
              value={geometry}
              onChange={(event) =>
                setGeometry(
                  choice(
                    ["rect", "roundRect", "ellipse", "line"],
                    event.target.value,
                    "rect",
                  ),
                )
              }
            >
              {["rect", "roundRect", "ellipse", "line"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Fill
            <input
              aria-label="Shape fill"
              placeholder="none or #RRGGBB"
              value={fill}
              onChange={(event) => setFill(event.target.value)}
            />
          </label>
          <label>
            Stroke
            <input
              aria-label="Shape stroke"
              value={stroke}
              onChange={(event) => setStroke(event.target.value)}
            />
          </label>
        </fieldset>
      ) : null}
      {node.type === "image" ? (
        <fieldset>
          <legend>Image</legend>
          <label>
            Alternative text
            <input
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
            />
          </label>
          <label>
            Image fit
            <select
              value={fit}
              onChange={(event) =>
                setFit(
                  choice(
                    ["contain", "cover", "stretch"],
                    event.target.value,
                    "contain",
                  ),
                )
              }
            >
              {["contain", "cover", "stretch"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </fieldset>
      ) : null}
      {"children" in node ? (
        <fieldset>
          <legend>Layout</legend>
          <label>
            Container layout
            <select
              value={layout}
              onChange={(event) =>
                setLayout(
                  choice(
                    ["stack", "row", "grid", "canvas"],
                    event.target.value,
                    "canvas",
                  ),
                )
              }
            >
              {["stack", "row", "grid", "canvas"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Gap
            <input
              type="number"
              value={gap}
              onChange={(event) => setGap(Number(event.target.value))}
            />
          </label>
          {layout === "grid" ? (
            <label>
              Grid columns
              <input
                type="number"
                min={1}
                value={gridColumns}
                onChange={(event) => setGridColumns(Number(event.target.value))}
              />
            </label>
          ) : null}
        </fieldset>
      ) : null}
      <fieldset>
        <legend>Position and size</legend>
        {(["x", "y", "width", "height", "rotation"] as const).map((key) => (
          <label key={key}>
            {key}
            <input
              aria-label={`Element ${key}`}
              type="number"
              step="any"
              value={bounds[key] ?? 0}
              onChange={(event) =>
                setBounds({ ...bounds, [key]: Number(event.target.value) })
              }
            />
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Text formatting</legend>
        <label>
          Font family
          <input
            value={style.fontFamily ?? ""}
            placeholder="Inherited"
            onChange={(event) =>
              setStyle({ ...style, fontFamily: event.target.value })
            }
          />
        </label>
        <label>
          Font size
          <input
            type="number"
            min={1}
            max={4000}
            value={style.fontSize ?? ""}
            placeholder="Inherited"
            onChange={(event) => {
              const { fontSize: _, ...rest } = style;
              setStyle(
                event.target.value
                  ? { ...style, fontSize: Number(event.target.value) }
                  : rest,
              );
            }}
          />
        </label>
        <label>
          Text color
          <input
            type="color"
            value={style.color ?? "#172033"}
            onChange={(event) =>
              setStyle({ ...style, color: event.target.value })
            }
          />
        </label>
        {(["bold", "italic", "underline"] as const).map((key) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={style[key] ?? false}
              onChange={(event) =>
                setStyle({ ...style, [key]: event.target.checked })
              }
            />
            {key}
          </label>
        ))}
        <label>
          Alignment
          <select
            value={style.align ?? "left"}
            onChange={(event) =>
              setStyle({
                ...style,
                align: choice(
                  ["left", "center", "right", "justify"],
                  event.target.value,
                  "left",
                ),
              })
            }
          >
            {["left", "center", "right", "justify"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </fieldset>
      {!("children" in node) ? (
        <fieldset>
          <legend>Animation</legend>
          <label>
            Reveal step
            <input
              aria-label="Reveal step"
              type="number"
              min={0}
              max={10000}
              value={step}
              onChange={(event) => setStep(Number(event.target.value))}
            />
          </label>
          <label>
            Entrance effect
            <select
              aria-label="Entrance effect"
              value={effect}
              onChange={(event) =>
                setEffect(
                  choice(
                    ["none", "fade", "rise", "slide", "zoom"],
                    event.target.value,
                    "none",
                  ),
                )
              }
            >
              {["none", "fade", "rise", "slide", "zoom"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Duration (ms)
            <input
              aria-label="Animation duration"
              type="number"
              min={0}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
          </label>
          <label>
            Delay (ms)
            <input
              aria-label="Animation delay"
              type="number"
              min={0}
              value={delay}
              onChange={(event) => setDelay(Number(event.target.value))}
            />
          </label>
          <label>
            Easing
            <select
              aria-label="Animation easing"
              value={easing}
              onChange={(event) =>
                setEasing(
                  choice(
                    ["easeOut", "easeInOut", "linear"],
                    event.target.value,
                    "easeOut",
                  ),
                )
              }
            >
              {["easeOut", "easeInOut", "linear"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </fieldset>
      ) : null}
      <button type="submit">Apply properties</button>
      {"text" in node ? <button type="submit">Apply text</button> : null}
    </form>
  );
}
/** Full node properties use atomic document operations, including animation, rich runs, table data, layout and geometry. */
export function NodeInspector({
  onError,
}: {
  readonly onError?: (error: LipatError) => void;
}): ReactNode {
  const state = useDeckState(),
    deck = useDeck(),
    readOnly = useDeckReadOnly(),
    compiled = useDeckScene();
  const slide = state.document.slides.find(
      (item) => item.id === state.activeSlideId,
    ),
    id = state.selection[0];
  const node = slide && id ? findSlideNode(slide.content, id) : undefined;
  const element = compiled.ok
    ? compiled.value.scene.slides
        .find((item) => item.id === slide?.id)
        ?.elements.find((item) => item.id === id)
    : undefined;
  return (
    <aside className="lipat-inspector" aria-label="Element inspector">
      {node ? (
        <>
          <p>
            {node.id} · {node.type}
          </p>
          {readOnly ? (
            <p>{getNodeText(node)}</p>
          ) : (
            <PropertyForm
              key={`${node.id}-${state.revision}`}
              node={node}
              frame={
                element?.frame ??
                node.frame ?? { x: 0, y: 0, width: 320, height: 180 }
              }
              {...(onError ? { onError } : {})}
            />
          )}
        </>
      ) : (
        <p>Select an element to edit it.</p>
      )}
      {slide ? (
        <label>
          Speaker notes
          <textarea
            aria-label="Speaker notes"
            readOnly={readOnly}
            value={slide.notes ?? ""}
            onChange={(event) => {
              const result = deck.apply([
                {
                  type: "updateSlide",
                  slideId: slide.id,
                  notes: event.target.value,
                },
              ]);
              if (!result.ok) onError?.(result.error);
            }}
          />
        </label>
      ) : null}
    </aside>
  );
}
