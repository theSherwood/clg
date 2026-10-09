import { type ScriptSettings, default_period, default_stave_style, default_stems_style } from "./script_drawings";
import { default_stave, default_stems, default_syllabics } from "./scripts";

// Named sets of script settings for the playground: a few built in, and any the reader saves,
// kept in this browser. A preset holds every script setting but the size and the text.

export type Preset = { name: string; settings: ScriptSettings; builtin?: true };

const defaults: ScriptSettings = {
  stems: default_stems,
  stems_style: default_stems_style,
  stave: default_stave,
  stave_style: default_stave_style,
  syllabics: default_syllabics,
  period: default_period,
};

// A built-in preset: the defaults with some of the stave's style and the period changed
const builtin = (
  name: string,
  stave_style: Partial<ScriptSettings["stave_style"]>,
  period = default_period,
  stems_style = default_stems_style,
): Preset => ({
  name,
  settings: { ...defaults, stave_style: { ...default_stave_style, ...stave_style }, period, stems_style },
  builtin: true,
});

const RINGS = { midline: true, midline_shape: "circle", subclauses: "circles", solver: "flow" } as const;

export const BUILTIN_PRESETS: Preset[] = [
  builtin("Default", {}),
  builtin("Cursive on a rule", { midline: true }),
  builtin(
    "Separate squares on a rule",
    { join: "separate", loop_mark: "square", midline: true },
    { shape: "square", scale: 1 },
    { join: "separate" },
  ),
  builtin("Cursive rings", RINGS),
  builtin("Angular ticks in rings", { ...RINGS, join: "angular", loop_mark: "tick" }),
  builtin(
    "Dashes and diamonds in rings",
    { ...RINGS, join: "dashes", loop_mark: "diamond", crossing_shape: "diamond" },
    { shape: "diamond", scale: 1 },
  ),
  builtin("Evenly spaced rings", { ...RINGS, join: "angular", loop_mark: "tick", spacing: "even" }),
];

const SAVED_KEY = "script_presets";

export function load_saved_presets(): Preset[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    if (!Array.isArray(saved)) return [];
    // Settings saved before a field was added get its default
    return saved
      .filter((p): p is Preset => typeof p?.name === "string" && typeof p?.settings === "object" && p.settings !== null)
      .map((p) => ({
        name: p.name,
        settings: {
          stems: { ...defaults.stems, ...p.settings.stems },
          stems_style: { ...defaults.stems_style, ...p.settings.stems_style },
          stave: { ...defaults.stave, ...p.settings.stave },
          stave_style: { ...defaults.stave_style, ...p.settings.stave_style },
          syllabics: { ...defaults.syllabics, ...p.settings.syllabics },
          period: { ...defaults.period, ...p.settings.period },
        },
      }));
  } catch {
    return [];
  }
}

export function store_saved_presets(presets: Preset[]) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(presets.map(({ name, settings }) => ({ name, settings }))));
  } catch {}
}

// Whether two sets of settings are the same, whatever order their fields were saved in
const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : typeof value === "object" && value !== null
      ? `{${Object.keys(value)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`)
          .join(",")}}`
      : JSON.stringify(value);
export const same_settings = (a: ScriptSettings, b: ScriptSettings) => canonical(a) === canonical(b);
