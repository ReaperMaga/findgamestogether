# Find Games Together

A platform for finding Steam games that match genres you and your friends both enjoy and can play together.

Find Games Together takes the friction out of choosing what to play. Add two to six Steam profiles and get multiplayer recommendations based on games sampled from each person’s library. The group does not need to own the same games.

## Features

- Analyze a random selection from the public Steam libraries of 2-6 players.
- Accept profile URLs, SteamID64 values, and Steam vanity names.
- Infer a shared taste profile from each person's sampled games without weighting by playtime.
- Discover new candidates through Steam's similar-game recommendations.
- Recommend multiplayer games that fit multiple players' histories.
- Exclude games the entire group already owns.
- Show existing ownership as context, not as the matching criteria.
- Optionally narrow recommendations to selected genres.
- Rank results only by how strongly Steam's similar-game results overlap across players.

## Tech stack

- [Nuxt](https://nuxt.com/)
- [Nuxt UI](https://ui.nuxt.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)
- TypeScript

## Local development

Install the dependencies:

```bash
pnpm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Fill in `NUXT_STEAM_API_KEY` in `.env`. You can create a Steam Web API key at [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey).

Start the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## How recommendations work

For every search and reroll, the server takes a new random, equally sized sample from each player's library and uses Steam's public **More Like This** results to build a candidate set. Playtime and recency are not used. Multiplayer candidates are ranked only by how many players' sampled games led to them and how highly they appeared in Steam's similar-game results. Games already owned by everyone are removed.

## Steam privacy requirements

Every player being compared must make both **Profile** and **Game details** public in Steam's privacy settings. Private libraries cannot be read by the Steam Web API. API credentials remain server-only, and the browser only receives the recommendation result.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Production

Build and preview the production application:

```bash
pnpm build
pnpm preview
```
