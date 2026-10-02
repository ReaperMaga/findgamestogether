<script setup lang="ts">
import type { GameRecommendation } from '~~/shared/types/steam'

const props = defineProps<{
  game: GameRecommendation
  rank: number
  playerIndex: Record<string, number>
  spotlight: number | null
  /** The top pick: a wide row with the image beside the details. */
  lead?: boolean
}>()

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const genres = computed(() => props.game.genres.slice(0, props.lead ? 6 : 4))
const spotlightOwns = computed(() => props.spotlight !== null && props.game.players.some(player => player.owns && props.playerIndex[player.steamId] === props.spotlight))
</script>

<template>
  <article
    :class="[spotlightOwns ? `spot seat-${(spotlight ?? 0) + 1}` : '', { 'md:flex-row': lead }]"
    class="game group flex flex-col overflow-hidden rounded-md border border-default bg-(--panel) transition-colors duration-200 hover:border-accented"
  >
    <div class="relative" :class="{ 'md:w-[55%] md:shrink-0': lead }">
      <img
        :src="game.imageUrl"
        :alt="`${game.name} Steam header`"
        class="aspect-[460/215] w-full bg-elevated object-cover"
        :class="{ 'md:h-full': lead }"
        :loading="lead ? 'eager' : 'lazy'"
      >
      <span
        class="font-display absolute left-0 top-0 rounded-br-md bg-inverted text-inverted"
        :class="lead ? 'px-3 py-2 text-4xl' : 'px-2 py-1.5 text-2xl'"
      >
        <span class="sr-only">Rank </span>{{ rank }}
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-4 p-4" :class="{ 'md:p-6': lead }">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h3 class="line-clamp-2 font-semibold leading-snug text-highlighted" :class="lead ? 'text-2xl md:text-3xl' : 'text-lg'">{{ game.name }}</h3>
          <p v-if="game.categories.length" class="mt-1 truncate text-sm text-muted">{{ game.categories.join(' · ') }}</p>
        </div>
        <p class="shrink-0 text-right" :aria-label="`${game.score}% match`">
          <span class="font-display text-highlighted" :class="lead ? 'text-6xl' : 'text-4xl'">{{ game.score }}</span><span class="font-tag text-lg text-muted">%</span>
          <span class="block text-xs text-dimmed">match</span>
        </p>
      </div>

      <ul v-if="genres.length" class="flex flex-wrap gap-1.5" aria-label="Tags">
        <li
          v-for="genre in genres"
          :key="genre"
          class="rounded-sm border px-2 py-0.5 text-xs"
          :class="game.genreMatches.includes(genre) ? 'border-accented text-highlighted' : 'border-muted text-muted'"
        >
          {{ genre }}
        </li>
      </ul>

      <p v-if="game.similarTo.length" class="text-sm text-muted">
        Similar to <span class="text-default">{{ game.similarTo.join(', ') }}</span>
      </p>

      <div class="mt-auto flex items-end justify-between gap-4 border-t border-muted pt-4">
        <div class="flex flex-col gap-2">
          <ul class="flex flex-wrap gap-1.5" aria-label="Who owns it">
            <li
              v-for="player in game.players"
              :key="player.steamId"
              :class="[
                `seat-${(playerIndex[player.steamId] ?? 0) + 1}`,
                player.owns ? 'owns' : 'missing',
                spotlight !== null && spotlight !== playerIndex[player.steamId] ? 'dimmed' : '',
                spotlight === playerIndex[player.steamId] ? 'lit' : ''
              ]"
              class="own font-tag flex size-8 items-center justify-center rounded-sm text-sm"
              :title="`${player.name} ${player.owns ? 'owns it' : 'doesn’t own it'}`"
            >
              <span aria-hidden="true">P{{ (playerIndex[player.steamId] ?? 0) + 1 }}</span>
              <span class="sr-only">{{ player.name }} {{ player.owns ? 'owns it' : 'doesn’t own it' }}</span>
            </li>
          </ul>
          <p class="flex flex-wrap gap-x-3 text-xs text-muted">
            <span>{{ game.ownedByCount }} of {{ game.players.length }} own it</span>
            <span v-if="game.reviewScore !== undefined && game.reviewCount" :title="`${game.reviewCount.toLocaleString('en')} Steam reviews`">
              {{ game.reviewScore }}% positive · {{ compactNumber.format(game.reviewCount) }} reviews
            </span>
            <span v-else-if="game.metacritic">Metacritic {{ game.metacritic }}</span>
            <span v-if="game.free" class="text-highlighted">Free to play</span>
          </p>
        </div>
        <UButton
          :href="game.storeUrl"
          target="_blank"
          rel="noopener"
          label="Steam"
          trailing-icon="i-lucide-arrow-up-right"
          color="neutral"
          variant="outline"
          size="sm"
          :aria-label="`Open ${game.name} on Steam`"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.spot {
  border-color: var(--pc);
}

.own {
  transition: opacity 200ms var(--ease-out-expo), transform 200ms var(--ease-out-expo);
}

.owns {
  background: var(--pc);
  color: var(--p-ink);
}

.missing {
  border: 1px dashed color-mix(in oklab, var(--pc) 70%, transparent);
  color: var(--pc);
}

.dimmed {
  opacity: 0.2;
}

.lit {
  transform: scale(1.15);
}
</style>
