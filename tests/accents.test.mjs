import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const rgba = (r, g, b, a = 1) => ({ r, g, b, a });
const hex = value => rgba(...[1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255));
const context = vm.createContext({ Qt: { rgba, color: hex } });
const load = name => vm.runInContext(readFileSync(new URL(`../DCommon/Common/${name}`, import.meta.url), "utf8").replace(/^\.(pragma|import).*$/gm, ""), context);
load("Contrast.js");
context.Contrast = { ratio: context.ratio };
load("Hct.js");
context.Hct = context;
load("Accents.js");

const PRIMARIES = ["#D0BCFF", "#7fbbb3", "#ff2d95", "#9a9a9a", "#7aa2f7"];

test("every slot stays readable and in gamut for muted, vivid and neutral primaries in both modes", () => {
    for (const primary of PRIMARIES) {
        for (const isLight of [false, true]) {
            const accents = context.derive(hex(primary), isLight, null);
            for (const slot of context.SLOTS) {
                const { container, onContainer } = accents[slot];
                assert.ok(context.ratio(onContainer, container) >= 4.5, `${primary} ${isLight ? "light" : "dark"} ${slot}`);
                for (const c of [container, onContainer])
                    assert.ok(["r", "g", "b"].every(k => c[k] >= 0 && c[k] <= 1), `${primary} ${slot} out of gamut`);
            }
        }
    }
});

test("a theme override replaces the slot hue", () => {
    const overridden = context.derive(hex("#D0BCFF"), false, { "blue": "#00c853" });
    assert.ok(context.differenceDegrees(context.toHct(hex("#00c853")).hue, context.toHct(overridden.blue.container).hue) < 1);
});

test("wallpaper alerts take the key's own hue, muted", () => {
    for (const key of ["#7fbbb3", "#ff2d95", "#7aa2f7"]) {
        const { alert, soft } = context.alerts(hex(key), false, "wallpaper");
        const keyHue = context.toHct(hex(key)).hue;
        for (const c of [alert, soft]) {
            const h = context.toHct(c);
            assert.ok(context.differenceDegrees(keyHue, h.hue) < 3, `${key} hue`);
            assert.ok(h.chroma <= context.ALERT_CHROMA + 1, `${key} not muted`);
        }
    }
});

test("harmonised alerts stay red and orange, bent toward the key", () => {
    const key = hex("#7aa2f7");
    const { alert, soft } = context.alerts(key, false, "harmonised");
    const keyHue = context.toHct(key).hue;
    for (const [c, anchor] of [[alert, context.ANCHOR_HUES.red], [soft, context.ANCHOR_HUES.orange]]) {
        const hue = context.toHct(c).hue;
        assert.ok(context.differenceDegrees(hue, anchor) <= 16, "left its anchor");
        assert.ok(context.differenceDegrees(hue, keyHue) < context.differenceDegrees(anchor, keyHue), "not bent toward the key");
    }
});

test("a hueless key falls back to red and orange, and every alert reads on its surface", () => {
    for (const source of ["wallpaper", "harmonised"]) {
        for (const isLight of [false, true]) {
            const { alert, soft } = context.alerts(hex(isLight ? "#000000" : "#ffffff"), isLight, source);
            assert.ok(context.differenceDegrees(context.toHct(alert).hue, context.ANCHOR_HUES.red) < 3, `${source} red`);
            assert.ok(context.differenceDegrees(context.toHct(soft).hue, context.ANCHOR_HUES.orange) < 3, `${source} orange`);
            const surface = hex(isLight ? "#f9f9f9" : "#131315");
            for (const c of [alert, soft])
                assert.ok(context.ratio(c, surface) >= 4.5, `${source} ${isLight ? "light" : "dark"} unreadable`);
        }
    }
});
