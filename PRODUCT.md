# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A friend group deciding what to play right now. Typically one person, already in a voice call (Discord or similar) with friends, pastes everyone's Steam profiles and reads the results aloud or screen-shares them so the group can agree on something tonight.

## Product Purpose

Find Games Together takes the friction out of choosing what to play together. It reads 2–6 public Steam libraries and returns online multiplayer games that fit the group's combined taste. Success: the group lands on a game it is happy to start in minutes, not after a long back-and-forth.

## Positioning

Recommendations come from each player's own library, not from a shared-ownership intersection. The group does not need to own the same games: the tool starts from each person's most-played games (playtime-weighted, with a recency boost), follows Steam's "More Like This" results, and ranks online multiplayer candidates by how strongly those results overlap across players, adjusted for Steam review scores. Every reroll starts from different favorites and never repeats a game already shown.

## Operating Context

- Used live, often on a second monitor or screen-shared during a voice call, typically in the evening.
- Input: Steam profile URLs, SteamID64 values, or vanity names.
- Every compared profile must have Profile and Game details set to Public in Steam privacy settings.
- Results link out to the Steam store.

## Capabilities and Constraints

- 2–6 players; form state (profiles, genres) persists in localStorage.
- Optional genre filter (Action, Adventure, Casual, Indie, Massively Multiplayer, Racing, RPG, Simulation, Sports, Strategy).
- Online multiplayer only (online co-op/PvP, MMO, cross-platform, Remote Play Together); split-screen or LAN-only games are excluded. Confirmed by the user on 2026-10-02.
- Results: players with avatars and library sizes, inferred shared taste profile (Steam tag percentages), stats, warnings, up to 24 recommended games.
- Per game: header image, name, multiplayer modes, tags (matching ones highlighted), group fit score, "similar to" source games, per-player ownership, owned count, Steam review score and count, free flag, Steam link.
- Result tools: search, sort (best match, highest rated, least owned, most owned), hide games similar to selected source games, reroll (excludes already-seen games).
- Games owned by the whole group are excluded; ownership is context, not a ranking criterion.
- Stack: Nuxt 4, Nuxt UI 4, Tailwind 4, deployed to Cloudflare Workers. Steam API key is server-only.

## Brand Commitments

Name: "Find Games Together". The user asked for a complete redesign; no visual element of the previous version is binding. Explicitly unwanted: gradient-heavy, glowing aesthetics.

## Evidence on Hand

- Real data comes only from the Steam API at runtime (game header images, avatars).
- No testimonials, user counts, or press exist; do not invent them.
- Screenshots of the previous version: `screenshots/`.

## Product Principles

1. Get the group to a decision fast: input is quick, results are scannable at a glance and readable over a screen-share.
2. Explain the why: every recommendation shows which games it came from and who owns it.
3. Honest mechanism: say plainly how results are made (most-played games, Steam similar games, review scores), never overclaim.
4. Reroll is cheap: a fresh set is always one action away.

## Accessibility & Inclusion

No product-specific requirement established; meet WCAG AA contrast and full keyboard operability.
