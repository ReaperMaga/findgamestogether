---
version: 1
slug: "app-pages-index-vue"
primary_target: "app/pages/index.vue"
related_targets: ["app/components/home"]
---

# Home (app/pages/index.vue)

Scope: the single route: player setup form and recommendation results. Mode: Operate.
Audience/job: one person in a voice call enters 2–6 Steam profiles and screen-shares results so the group agrees on a game tonight.
Constraints: Nuxt UI 4 components (themed), all current features, dark-first, no gradients or glow.

## Direction contract

THESIS: The group "locks in" like players on a co-op select screen; every result shows who it fits. Refuses the centered-hero + form-card + soft card grid default.

OWN-WORLD: Near-black flat ground (#0f0f11), panels #18181b, seams #2a2a2f, bone text. Six fixed player colors (P1 blue, P2 red, P3 green, P4 amber, P5 violet, P6 pink) used only as player identity: slot top bars, P-tags, ownership squares, avatar rings. Archivo variable: condensed (wdth 62–75) heavy uppercase for display and P-tags, normal width for body; tabular figures. Square-ish 6px corners, 1px seams, no shadows-as-glow, no gradients.

STORY: Visitor sees "Who's playing?", fills slots, presses Start; reads a ranked lineup where each game shows the players as colored squares (filled = owns), the match %, and why it was suggested; rerolls until the group picks.

FIRST VIEWPORT: Slim top bar (mark + name). Left-aligned huge condensed "WHO'S PLAYING?" with one-line mechanism. A grid of player slots (3 across desktop, 1 mobile): P-number in player color, color bar, Steam input; a dashed "Join" slot adds players. Genre toggles beneath, then a full-width bone START button.

FORM: Player Select, position 1 on my ordered list; seed key 071a7524.

Signature interaction: slots join with a color bar wipe; in results, hovering a player in the lineup spotlights that player's ownership squares across all games.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
