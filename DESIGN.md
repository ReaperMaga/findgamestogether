---
name: Find Games Together
description: A co-op player select screen that turns 2-6 Steam libraries into a ranked lineup the whole group can read at a glance.
colors:
  ground: "#0f0f11"
  ground-muted: "#151518"
  panel: "#18181b"
  surface-elevated: "#1c1c20"
  surface-accented: "#26262b"
  seam: "#29292e"
  seam-muted: "#202024"
  seam-accented: "#3b3b42"
  bone: "#f2f1ec"
  text-default: "#dcdcdf"
  text-toned: "#c3c3c8"
  text-muted: "#9c9ca4"
  text-dimmed: "#8a8a92"
  p1-blue: "#5b95ff"
  p2-red: "#ff6058"
  p3-green: "#45c46d"
  p4-amber: "#ffb02e"
  p5-violet: "#b382ff"
  p6-pink: "#ff6fae"
  light-ground: "#f6f6f4"
  light-panel: "#ffffff"
  light-surface-elevated: "#e9e9e6"
  light-seam: "#dcdcd8"
  light-seam-accented: "#c4c4bf"
  light-ink: "#121214"
  light-text-default: "#2a2a2e"
  light-text-muted: "#616166"
  light-text-dimmed: "#6b6b70"
  light-p1-blue: "#2563eb"
  light-p2-red: "#d92d2d"
  light-p3-green: "#16803c"
  light-p4-amber: "#a86200"
  light-p5-violet: "#7c3aed"
  light-p6-pink: "#c8246f"
typography:
  display:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "clamp(3rem, 9vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 70"
  headline:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 70"
  tag:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 75"
  title:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum'"
  label:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.333
    fontFeature: "'tnum'"
rounded:
  hairline: "1px"
  sm: "6px"
  md: "9px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
  section-wide: "64px"
components:
  button-start:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ground}"
    typography: "{typography.display}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "64px"
  button-outline:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text-default}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  player-slot:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-default}"
    rounded: "{rounded.md}"
    padding: "20px 16px 16px"
  genre-toggle:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text-toned}"
    typography: "{typography.tag}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  genre-toggle-pressed:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ground}"
  ownership-square:
    backgroundColor: "{colors.p1-blue}"
    textColor: "{colors.ground}"
    typography: "{typography.tag}"
    rounded: "{rounded.sm}"
    size: "32px"
  rank-block:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ground}"
    typography: "{typography.display}"
    padding: "6px 8px"
  game-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-default}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.bone}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Find Games Together

## Overview

**Creative North Star: "The Player Select Screen"**

The group locks in the way players do on a co-op select screen: each person takes a numbered seat with a fixed color, the screen reads a ready check, and the result is a ranked lineup where every game shows, in those same seat colors, who it fits. The ground is near-black and flat, panels sit one tone up, and 1px seams do the structural work. Nothing glows and nothing is gradient-filled; the only saturated color on screen belongs to a player.

Type carries the arcade voice. One variable family, Archivo, is pulled condensed and heavy for display numerals, seat numbers and labels, and left at normal width for reading. Figures are tabular everywhere so match percentages and counts line up across a grid that is being read aloud over a screen-share. Density is moderate: the form fits above the fold at 1440x900, and the results grid is scannable from across a room.

Dark is the default and the home of the world; light mode exists behind the header toggle with deeper seat colors so identity stays legible on paper-white panels.

**Key Characteristics:**
- Flat near-black ground, tonal panels, 1px seams, no shadows, no gradients, no glow.
- Six fixed seat colors (P1-P6) used only to mark who something belongs to.
- Bone (near-white) is the one "loud" neutral: primary action, pressed toggle, rank block, results rule.
- Condensed heavy uppercase Archivo for display and tags; normal-width Archivo for body; tabular figures.
- Small, square-ish corners (6px and 9px); dashed outlines mean "empty seat" or "doesn't own it".

## Colors

A neutral near-black world with zero tint, one bone accent for action, and six seat hues that exist only as player identity.

### Primary
- **Bone** (bone): The action and emphasis neutral. Fills the primary Find games button and the Reroll recommendations button, the pressed genre toggle, the rank corner block, the shared-taste fill bars and the 2px rule that opens the results. Also the selection highlight and the focus ring color. In light mode the same role is taken by Ink (light-ink).

### Secondary (seat colors)
- **P1 Blue** (p1-blue), **P2 Red** (p2-red), **P3 Green** (p3-green), **P4 Amber** (p4-amber), **P5 Violet** (p5-violet), **P6 Pink** (p6-pink): Player identity. Applied through a per-seat custom property (`--pc`, set by `seat-1` to `seat-6`) to: the slot top bar, the P-number, the Ready tag, a ready slot's tinted border (45% mix into the seam), a focused slot's border, ownership squares, avatar outlines, the spotlight border on game cards, and the Highlight owner toolbar chips. Text on a filled seat color uses Seat Ink (ground in dark, white in light).
- **Light seat set** (light-p1-blue to light-p6-pink): The same six identities darkened so white text on a filled square and seat-colored text on white panels both pass AA.

### Neutral
- **Ground** (ground): Page background, input fill, sticky toolbar fill.
- **Ground Muted** (ground-muted): Nuxt UI muted surface.
- **Panel** (panel): Player slots, game cards, player lineup buttons.
- **Surface Elevated / Accented** (surface-elevated, surface-accented): Image placeholder and pinned player button; the unfilled track of taste bars.
- **Seam / Seam Muted / Seam Accented** (seam, seam-muted, seam-accented): Default 1px borders; inner card dividers and unmatched tags; hover borders, dashed Join slot, genre toggle outline, matched tags.
- **Text ramp** (text-default, text-toned, text-muted, text-dimmed): Body, strong secondary, supporting copy, fine print. Headings use Bone.
- **Light neutrals** (light-ground, light-panel, light-surface-elevated, light-seam, light-seam-accented, light-ink, light-text-*): The same roles in light mode; untinted warm-gray paper with near-black ink.

### Named Rules
**The Seat Color Rule.** A seat color marks who a thing belongs to and nothing else. Never use P1-P6 for status, success, error, links, emphasis or decoration.

**The Neutral Alert Rule.** Errors and warnings are neutral outline alerts with an icon, never red, amber or green, so a message can never be mistaken for a player.

**The Bone Is Action Rule.** The one filled, high-contrast neutral (Bone in dark, Ink in light) is reserved for the primary action, a pressed/selected state, the rank block and data fills. It is never a large decorative surface.

## Typography

**Display Font:** Archivo Variable, condensed (with ui-sans-serif, system-ui, Segoe UI fallback)
**Body Font:** Archivo Variable, normal width (same stack)

**Character:** One self-hosted variable family pulled along its width axis: squeezed to 70% and 800 weight for shouty select-screen numerals, 75% and 700 for labels, normal width for reading. Tabular figures are on globally.

### Hierarchy
- **Display** (800, wdth 70%, uppercase, clamp(3rem, 9vw, 6rem), line-height 0.92): The page question ("Who's playing?"). The same face carries every big numeral: P-numbers in slots (30px / 36px from 640px), match % (36px, 60px on the lead), rank (24px, 36px on the lead), and the start button label (28px).
- **Headline** (800, wdth 70%, uppercase, clamp(2.25rem, 6vw, 3.75rem), line-height 0.92): The results heading ("N games for this lineup").
- **Tag** (700, wdth 75%, uppercase, letter-spacing 0.02em, 14-24px): Section labels inside the flow (Narrow by genre, Shared taste at 20px), genre toggles, Ready, P-tags in squares and chips, the wordmark (18px), closing prompt (24px).
- **Title** (600, normal width, 18px, line-height 1.375; 24px / 30px on the lead card): Game names, player names (16px).
- **Body** (400, 16px, line-height 1.5): Running copy. The lede is 18px, relaxed leading, max 52ch, in muted text.
- **Label** (400, 12-14px): Meta lines, counts, "match", fine print; muted or dimmed.

### Named Rules
**The One Family Rule.** Archivo is the only face. Hierarchy comes from width, weight and case, not from a second family or a system display face.

**The Tabular Rule.** All figures are tabular; percentages, counts and ranks align across cards.

## Layout

One centered column, max 72rem (1152px), 16px gutter (24px from 640px). The page stacks with 48px gaps (64px from 640px) and 48/64px vertical padding. The header is a slim 56px bar with the mark and wordmark left and the color-mode toggle right, closed by a 1px seam; the footer mirrors it.

The setup is left-aligned, never centered: the display question and lede, then the seat grid (1 column, 2 from 640px, 3 from 1024px, 12px gaps), then a 1px seam and a two-column band from 1024px: genre toggles and mechanism notes on the left, a 22rem action column on the right holding any alert, the start button and its note, bottom-aligned. Below 1024px the action column stacks and the button is full width. This keeps the start button above the fold at 1440x900.

Results open with a 2px Bone rule. Header row: headline left, Reroll right. Player lineup as an auto-fill grid (min 15rem, 8px gaps). The toolbar is sticky at the top of the viewport (search, hide-similar, sort; 3 columns from 1024px with a 12rem sort column) with a seam below. The game grid is 1, 2 (640px) and 3 (1280px) columns with 16px gaps; the #1 pick spans the full row and lays out image-left (55%) / details-right from 768px.

Spacing steps observed: 8, 12, 16, 24, 32, 48, 64px.

## Elevation & Depth

Flat. No box shadows, no glow, no gradients. Depth is tonal: ground, then panel one step up, then elevated for pressed or placeholder states, with 1px seams for structure. Emphasis is by inversion (a Bone block on dark) or by a seat-colored border, never by lift.

### Named Rules
**The Flat Seam Rule.** Surfaces separate by tone and a 1px seam. If something needs to stand out, invert it or give it its owner's color; never add a shadow.

## Shapes

Small, square-ish corners from a 6px base radius: 6px for chips, genre toggles, ownership squares, avatars and the seat chips; 9px for slots, cards, player buttons, inputs, buttons and empty states. The rank block is a square-cornered tab in the image's top-left with only its bottom-right corner rounded (9px). Taste bars are near-square (1px radius). Dashed 1px outlines carry a single meaning: absence (the empty Join slot, the no-results box, a player who does not own a game). The mark is a 2x2 grid of rounded seat-colored squares (P1-P4).

## Components

### Buttons
- **Shape:** gently squared (9px).
- **Start (primary):** solid Bone fill, ground text, 64px tall, 20px side padding, label in Display at 28px on the left ("Find games"), a 14px semibold ready check ("n/n ready") and arrow on the right. Disabled until every seat is filled; loading replaces the label ("Reading libraries").
- **Solid secondary:** same Bone fill at standard size for "Reroll recommendations".
- **Outline:** neutral, accented 1px ring, default text; used for Reroll, Steam store links (small, with up-right arrow) and Clear filters. Hover lifts to the elevated tone.
- **Ghost:** icon-only remove (x) on slots and the color-mode toggle.
- **Focus:** 2px Bone (Ink in light) outline, 2px offset, everywhere.

### Chips
- **Genre toggle:** Tag type at 14px, 6px radius, accented outline, toned text; hover brightens border and text; pressed is a full Bone fill with ground text.
- **Game tags:** 12px, 6px radius, outline only; tags that match the group's chosen genres use the accented border and Bone text, others the muted seam and muted text.
- **Seat chip (Highlight owner):** 28px tall, Tag type, seat-colored border (60% mix) and text; pressed fills with the seat color and Seat Ink text.

### Cards / Containers
- **Corner Style:** 9px.
- **Background:** Panel.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px seam; accented on hover; the full seat color when the spotlighted player owns the game.
- **Internal Padding:** 16px (24px on the lead card from 768px); inner footer separated by a muted seam with 16px top padding.

### Inputs / Fields
- **Style:** Nuxt UI outline input on the ground, 1px accented ring, 9px radius, leading icon (Steam glyph for profiles, search, eye-off, sort).
- **Focus:** the ring steps to the inverted neutral; inside a slot, the slot's own border takes the seat color.
- **Error:** reported in a neutral outline alert in the action column, never by tinting a field red.

### Navigation
- Slim 56px top bar: AppMark (24px) plus the wordmark in Tag type at 18px, Bone; ghost color-mode toggle on the right. No other navigation.

### Player Slot (signature)
A Panel card with a 4px seat-color bar along its top edge that wipes in left to right on join (600ms, expo-out). Header row: P-number in Display and seat color, "You" / "Player N" in muted text, a seat-colored Ready tag with a check once filled, and a ghost remove button when more than two players exist. Below, a large Steam input. Filled slots tint their border 45% toward the seat color; focus takes the full seat color. The final cell is a dashed Join slot ("Add player N", plus icon that rotates 90deg on hover, "Up to 6 players") until six seats exist.

### Game Card and Lead Row (signature)
Steam header image (460:215) with a Bone rank block in the top-left corner holding the rank in Display. Details: title, mode line, the match % in Display (the exact value results are ranked by) with a small "match" label, tags, "Similar to" source games, then a footer with ownership squares, an "n of m own it" / reviews / Free to play meta line and an outline Steam link. Rank #1 is the lead row spanning the grid with larger numerals and the image beside the details. Cards rise in (500ms, 45ms stagger, capped at 8).

### Ownership Squares and Spotlight (signature)
32px squares, 6px radius, P-number in Tag type. Owns: filled seat color, Seat Ink text. Doesn't own: dashed seat-color outline (70% mix), seat-color text. Hovering or focusing a player in the lineup (or pressing a toolbar seat chip, which pins) spotlights that player: their squares scale to 1.15, every other square drops to 20% opacity, and cards they own take their seat-color border (200ms, expo-out).

### Player Lineup Button
Panel button with avatar (6px radius, 2px seat-color outline offset 2px), name and library size, P-number in Display and seat color at the end. Hover borders in the seat color; pinned adds the elevated fill.

## Do's and Don'ts

### Do:
- **Do** route every player-specific color through the seat custom property (`seat-1` to `seat-6` setting `--pc`) and the six P tokens, in both modes.
- **Do** keep alerts, errors and warnings neutral outline with an icon.
- **Do** use Display (Archivo 800, wdth 70%, uppercase) for numerals that matter: P-numbers, rank, match %, the start label.
- **Do** keep the start button in the right-hand action column beside the genre toggles from 1024px so it stays above the fold, full width below that, with the label naming the action and the "n/n ready" count beside it.
- **Do** show the match % that actually orders the results; never a decorative or rescaled score.
- **Do** signal absence with a 1px dashed outline (empty seat, not owned, no results).
- **Do** use expo-out (cubic-bezier(0.16, 1, 0.3, 1)) for wipes, rise-ins and spotlight, and collapse all motion under prefers-reduced-motion.

### Don't:
- **Don't** use a seat color for status, links, buttons or decoration, and don't add a seventh hue.
- **Don't** add shadows, glows or gradients to any surface.
- **Don't** put a small uppercase label above a heading; the rank numeral and the lead row carry hierarchy, not a "top pick" style line.
- **Don't** center the setup or wrap the form in a hero card; it stays left-aligned on the open ground.
- **Don't** introduce a second typeface or a system display face; width and weight of Archivo do the work.
- **Don't** fill large surfaces with Bone; it is for action, selection, rank and data fills.
