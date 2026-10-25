import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { DeckRuntime } from "@lipat-internal/core";
import { getNodeText } from "@lipat-internal/model";
import type {
  DeckOperation,
  EntranceAnimation,
  LipatError,
  SlideNode,
  TextRun,
} from "@lipat-internal/model";
import {
  nativeEditorStyles,
  NativeEditorButton,
  NativeEditorField,
} from "./native-editor-controls";
/** Native node properties keep drafts local and apply portable content, formatting, layout and animation together. */
export function NativeNodeProperties({
  deck,
  node,
  onError,
}: {
  readonly deck: DeckRuntime;
  readonly node: SlideNode;
  readonly onError: (error: LipatError) => void;
}): ReactNode {
  const document = deck.exportDocument();
  const compiled = useMemo(() => deck.compile(), [deck, document]),
    resolved = compiled.ok
      ? compiled.value.scene.slides
          .flatMap((slide) => slide.elements)
          .find((element) => element.id === node.id)
      : undefined;
  const initialFrame = resolved?.frame ??
    node.frame ?? { x: 0, y: 0, width: 320, height: 180 };
  const [frame, setFrame] = useState(initialFrame),
    [text, setText] = useState(getNodeText(node)),
    [style, setStyle] = useState(node.style ?? {}),
    [effect, setEffect] = useState<EntranceAnimation["effect"] | "none">(
      node.animation?.effect ?? "none",
    ),
    [duration, setDuration] = useState(node.animation?.durationMs ?? 350),
    [delay, setDelay] = useState(node.animation?.delayMs ?? 0),
    [step, setStep] = useState(node.step ?? 0),
    [easing, setEasing] = useState<NonNullable<EntranceAnimation["easing"]>>(
      node.animation?.easing ?? "easeOut",
    );
  const [rich, setRich] = useState(
      "text" in node && typeof node.text !== "string",
    ),
    [runs, setRuns] = useState<readonly TextRun[]>(
      "text" in node && typeof node.text !== "string"
        ? node.text
        : [{ text: getNodeText(node) }],
    );
  const [fill, setFill] = useState(
      node.type === "shape" ? (node.fill ?? "") : "",
    ),
    [stroke, setStroke] = useState(
      node.type === "shape" ? (node.stroke ?? "") : "",
    ),
    [geometry, setGeometry] = useState(
      node.type === "shape" ? (node.geometry ?? "rect") : "rect",
    );
  const [fit, setFit] = useState(
      node.type === "image" ? (node.fit ?? "contain") : "contain",
    ),
    [alt, setAlt] = useState(node.type === "image" ? (node.alt ?? "") : ""),
    [ordered, setOrdered] = useState(
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
  const [language, setLanguage] = useState(
    node.type === "code" ? (node.language ?? "text") : "text",
  );
  const [level, setLevel] = useState(
    node.type === "heading" ? (node.level ?? 1) : 1,
  );
  const [layout, setLayout] = useState<"stack" | "row" | "grid" | "canvas">(
    "children" in node ? node.type : "canvas",
  );
  const [gap, setGap] = useState("gap" in node ? (node.gap ?? 16) : 16);
  const [gridColumns, setGridColumns] = useState(
    node.type === "grid" ? node.columns : 2,
  );
  const updateRun = (index: number, run: TextRun) =>
    setRuns(runs.map((item, i) => (i === index ? run : item)));
  const apply = () => {
    let updated: SlideNode = { ...node, style };
    if (node.type === "heading" || node.type === "text")
      updated = {
        ...node,
        style,
        text: rich ? runs : text,
        ...(node.type === "heading" ? { level } : {}),
      };
    else if (node.type === "code") updated = { ...node, style, text, language };
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
        fill: fill || null,
        stroke: stroke || null,
        geometry,
      };
    else if (node.type === "image") updated = { ...node, style, fit, alt };
    if ("children" in node)
      updated =
        layout === "grid"
          ? {
              ...node,
              type: layout,
              style,
              columns: gridColumns,
              gap,
              children: node.children,
            }
          : layout === "canvas"
            ? { ...node, type: layout, style, children: node.children }
            : { ...node, type: layout, style, gap, children: node.children };
    const moved = JSON.stringify(frame) !== JSON.stringify(initialFrame);
    if (moved) updated = { ...updated, frame };
    const operations: DeckOperation[] = [
      { type: "replaceNode", nodeId: node.id, node: updated },
    ];
    if (!("children" in node))
      operations.push(
        { type: "setStep", nodeId: node.id, step: step === 0 ? null : step },
        {
          type: "setAnimation",
          nodeId: node.id,
          animation:
            effect === "none"
              ? null
              : { effect, durationMs: duration, delayMs: delay, easing },
        },
      );
    const result =
      moved && !("children" in node)
        ? deck.applyToCanvas(deck.getState().activeSlideId, operations)
        : deck.apply(operations);
    if (!result.ok) onError(result.error);
  };
  return (
    <View style={nativeEditorStyles.panel}>
      <Text style={nativeEditorStyles.heading}>
        {node.type} · {node.id}
      </Text>
      {"text" in node || node.type === "list" ? (
        <NativeEditorField
          label="Selected text"
          value={text}
          onChange={setText}
          multiline
        />
      ) : null}
      {node.type === "heading" || node.type === "text" ? (
        <>
          <NativeEditorButton
            label="Rich text runs"
            selected={rich}
            onPress={() => {
              setRich(!rich);
              if (!rich && runs.length === 1) setRuns([{ text }]);
            }}
          />
          {rich
            ? runs.map((run, index) => (
                <View key={index} style={nativeEditorStyles.panel}>
                  <NativeEditorField
                    label={`Run ${index + 1} text`}
                    value={run.text}
                    onChange={(value) =>
                      setRuns(
                        runs.map((item, i) =>
                          i === index ? { ...item, text: value } : item,
                        ),
                      )
                    }
                  />
                  <View style={nativeEditorStyles.bar}>
                    {(["bold", "italic", "underline"] as const).map((key) => (
                      <NativeEditorButton
                        key={key}
                        label={`Run ${index + 1} ${key}`}
                        selected={run.style?.[key] ?? false}
                        onPress={() =>
                          updateRun(index, {
                            ...run,
                            style: {
                              ...run.style,
                              [key]: !(run.style?.[key] ?? false),
                            },
                          })
                        }
                      />
                    ))}
                  </View>
                  <NativeEditorField
                    label={`Run ${index + 1} font family`}
                    value={run.style?.fontFamily ?? ""}
                    onChange={(value) =>
                      updateRun(index, {
                        ...run,
                        style: { ...run.style, fontFamily: value },
                      })
                    }
                  />
                  <NativeEditorField
                    label={`Run ${index + 1} font size`}
                    numeric
                    value={String(
                      run.style?.fontSize ??
                        style.fontSize ??
                        resolved?.style.fontSize ??
                        document.theme.fontSize,
                    )}
                    onChange={(value) =>
                      updateRun(index, {
                        ...run,
                        style: { ...run.style, fontSize: Number(value) },
                      })
                    }
                  />
                  <NativeEditorField
                    label={`Run ${index + 1} color`}
                    value={run.style?.color ?? style.color ?? "#172033"}
                    onChange={(value) =>
                      updateRun(index, {
                        ...run,
                        style: { ...run.style, color: value },
                      })
                    }
                  />
                  <View style={nativeEditorStyles.bar}>
                    {(["left", "center", "right", "justify"] as const).map(
                      (align) => (
                        <NativeEditorButton
                          key={align}
                          label={`Run ${index + 1} ${align}`}
                          selected={run.style?.align === align}
                          onPress={() =>
                            updateRun(index, {
                              ...run,
                              style: { ...run.style, align },
                            })
                          }
                        />
                      ),
                    )}
                  </View>
                  <NativeEditorButton
                    label={`Remove run ${index + 1}`}
                    disabled={runs.length === 1}
                    onPress={() => setRuns(runs.filter((_, i) => i !== index))}
                  />
                </View>
              ))
            : null}
          {rich ? (
            <NativeEditorButton
              label="Add text run"
              onPress={() => setRuns([...runs, { text: "New run" }])}
            />
          ) : null}
        </>
      ) : null}
      {node.type === "table" ? (
        <>
          <NativeEditorField
            label="Table columns (tabs)"
            value={columns}
            onChange={setColumns}
            multiline
          />
          <NativeEditorField
            label="Table rows (tabs/new lines)"
            value={rows}
            onChange={setRows}
            multiline
          />
        </>
      ) : null}
      {node.type === "list" ? (
        <NativeEditorButton
          label="Numbered list"
          selected={ordered}
          onPress={() => setOrdered(!ordered)}
        />
      ) : null}
      {node.type === "shape" ? (
        <>
          <NativeEditorField
            label="Shape fill"
            value={fill}
            onChange={setFill}
          />
          <NativeEditorField
            label="Shape stroke"
            value={stroke}
            onChange={setStroke}
          />
          <View style={nativeEditorStyles.bar}>
            {(["rect", "roundRect", "ellipse", "line"] as const).map(
              (value) => (
                <NativeEditorButton
                  key={value}
                  label={value}
                  selected={geometry === value}
                  onPress={() => setGeometry(value)}
                />
              ),
            )}
          </View>
        </>
      ) : null}
      {node.type === "image" ? (
        <>
          <NativeEditorField
            label="Alternative text"
            value={alt}
            onChange={setAlt}
          />
          <View style={nativeEditorStyles.bar}>
            {(["contain", "cover", "stretch"] as const).map((value) => (
              <NativeEditorButton
                key={value}
                label={value}
                selected={fit === value}
                onPress={() => setFit(value)}
              />
            ))}
          </View>
        </>
      ) : null}
      {node.type === "heading" ? (
        <NativeEditorField
          label="Heading level"
          value={String(level)}
          numeric
          onChange={(value) => setLevel(Number(value))}
        />
      ) : null}
      {node.type === "code" ? (
        <NativeEditorField
          label="Code language"
          value={language}
          onChange={setLanguage}
        />
      ) : null}
      {"children" in node ? (
        <View style={nativeEditorStyles.panel}>
          <Text style={nativeEditorStyles.heading}>Container layout</Text>
          <View style={nativeEditorStyles.bar}>
            {(["stack", "row", "grid", "canvas"] as const).map((value) => (
              <NativeEditorButton
                key={value}
                label={value}
                selected={layout === value}
                onPress={() => setLayout(value)}
              />
            ))}
          </View>
          <NativeEditorField
            label="Layout gap"
            value={String(gap)}
            numeric
            onChange={(value) => setGap(Number(value))}
          />
          {layout === "grid" ? (
            <NativeEditorField
              label="Grid columns"
              value={String(gridColumns)}
              numeric
              onChange={(value) => setGridColumns(Number(value))}
            />
          ) : null}
        </View>
      ) : null}
      <Text style={nativeEditorStyles.heading}>Position and size</Text>
      <View style={nativeEditorStyles.bar}>
        {(["x", "y", "width", "height", "rotation"] as const).map((key) => (
          <NativeEditorField
            key={key}
            label={key}
            numeric
            value={String(frame[key] ?? 0)}
            onChange={(value) => setFrame({ ...frame, [key]: Number(value) })}
          />
        ))}
      </View>
      <NativeEditorField
        label="Font family"
        value={style.fontFamily ?? ""}
        onChange={(value) => setStyle({ ...style, fontFamily: value })}
      />
      <NativeEditorField
        label="Font size"
        value={String(
          style.fontSize ??
            resolved?.style.fontSize ??
            deck.exportDocument().theme.fontSize,
        )}
        numeric
        onChange={(value) => setStyle({ ...style, fontSize: Number(value) })}
      />
      <NativeEditorField
        label="Text color"
        value={style.color ?? "#172033"}
        onChange={(value) => setStyle({ ...style, color: value })}
      />
      <View style={nativeEditorStyles.bar}>
        {(["bold", "italic", "underline"] as const).map((key) => (
          <NativeEditorButton
            key={key}
            label={key}
            selected={style[key] ?? false}
            onPress={() =>
              setStyle({ ...style, [key]: !(style[key] ?? false) })
            }
          />
        ))}
      </View>
      <View style={nativeEditorStyles.bar}>
        {(["left", "center", "right", "justify"] as const).map((value) => (
          <NativeEditorButton
            key={value}
            label={value}
            selected={style.align === value}
            onPress={() => setStyle({ ...style, align: value })}
          />
        ))}
      </View>
      {!("children" in node) ? (
        <>
          <Text style={nativeEditorStyles.heading}>Animation</Text>
          <NativeEditorField
            label="Reveal step"
            value={String(step)}
            numeric
            onChange={(value) => setStep(Number(value))}
          />
          <View style={nativeEditorStyles.bar}>
            {(["none", "fade", "rise", "slide", "zoom"] as const).map(
              (value) => (
                <NativeEditorButton
                  key={value}
                  label={value}
                  selected={effect === value}
                  onPress={() => setEffect(value)}
                />
              ),
            )}
          </View>
          <NativeEditorField
            label="Duration (ms)"
            value={String(duration)}
            numeric
            onChange={(value) => setDuration(Number(value))}
          />
          <NativeEditorField
            label="Delay (ms)"
            value={String(delay)}
            numeric
            onChange={(value) => setDelay(Number(value))}
          />
          <View style={nativeEditorStyles.bar}>
            {(["easeOut", "easeInOut", "linear"] as const).map((value) => (
              <NativeEditorButton
                key={value}
                label={value}
                selected={easing === value}
                onPress={() => setEasing(value)}
              />
            ))}
          </View>
        </>
      ) : null}
      <NativeEditorButton label="Apply properties" onPress={apply} />
    </View>
  );
}
