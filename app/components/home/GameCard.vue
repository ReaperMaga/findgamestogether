<script setup lang="ts">
import type { GameRecommendation } from '~~/shared/types/steam'

defineProps<{
  game: GameRecommendation
  playerCount: number
}>()
</script>

<template>
  <UCard class="overflow-hidden" :ui="{ body: 'p-0 sm:p-0' }">
    <img :src="game.imageUrl" :alt="`${game.name} Steam header`" class="aspect-[460/215] w-full object-cover" loading="lazy">

    <div class="p-5">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h3 class="truncate text-lg font-semibold text-highlighted">{{ game.name }}</h3>
          <p class="mt-1 truncate text-sm text-muted">{{ game.categories.join(' · ') }}</p>
        </div>
        <UBadge :label="`${game.score}% match`" color="primary" variant="soft" />
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <UBadge
          v-for="genre in game.genres.slice(0, 4)"
          :key="genre"
          :label="genre"
          :color="game.genreMatches.includes(genre) ? 'primary' : 'neutral'"
          variant="subtle"
        />
      </div>

      <p class="mt-5 text-sm text-muted">
        Similar to <span class="text-default">{{ game.similarTo.join(', ') }}</span>
      </p>

      <div class="mt-4 divide-y divide-default rounded-md border border-default">
        <div v-for="player in game.players" :key="player.steamId" class="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span class="truncate">{{ player.name }}</span>
          <span v-if="player.owns" class="flex shrink-0 items-center gap-1.5 text-muted"><UIcon name="i-lucide-circle-check" class="text-success" />Owns</span>
          <span v-else class="flex shrink-0 items-center gap-1.5 text-dimmed"><UIcon name="i-lucide-shopping-cart" />Doesn’t own</span>
        </div>
      </div>

      <div class="mt-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 text-sm text-muted">
          <span>{{ game.ownedByCount }}/{{ playerCount }} own</span>
          <span v-if="game.metacritic">{{ game.metacritic }} Metacritic</span>
          <span v-if="game.free">Free</span>
        </div>
        <UButton :href="game.storeUrl" target="_blank" label="Steam" trailing-icon="i-lucide-external-link" color="neutral" variant="ghost" />
      </div>
    </div>
  </UCard>
</template>
