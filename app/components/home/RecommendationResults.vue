<script setup lang="ts">
import type { GameRecommendation, RecommendationsResponse } from '~~/shared/types/steam'

type SortOption = 'best' | 'rating' | 'least-owned' | 'most-owned'

defineProps<{
  results: RecommendationsResponse
  visibleGames: GameRecommendation[]
  similarToItems: Array<{ label: string, value: string }>
  loading: boolean
  rerolling: boolean
}>()

const emit = defineEmits<{
  clearFilters: []
  reroll: []
}>()

const search = defineModel<string>('search', { required: true })
const excludedSimilarTo = defineModel<string[]>('excludedSimilarTo', { required: true })
const sort = defineModel<SortOption>('sort', { required: true })

const sortItems: Array<{ label: string, value: SortOption }> = [
  { label: 'Best match', value: 'best' },
  { label: 'Highest rated', value: 'rating' },
  { label: 'Least owned', value: 'least-owned' },
  { label: 'Most owned', value: 'most-owned' }
]
</script>

<template>
  <section id="results" class="mx-auto mt-16 max-w-5xl scroll-mt-24" aria-live="polite">
    <div class="flex flex-col gap-5 border-b border-default pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium text-primary">Recommendations</p>
        <h2 class="mt-1 text-2xl font-semibold text-highlighted">{{ results.games.length }} multiplayer games match your group</h2>
        <p class="mt-2 text-sm text-muted">
          Based on {{ results.sourceGameCount }} randomly sampled games · {{ results.candidateGameCount }} similar games found · {{ results.analyzedGameCount }} analyzed
        </p>
      </div>
      <div class="flex items-center gap-4">
        <UButton
          v-if="results.games.length"
          type="button"
          label="Reroll"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="rerolling"
          :disabled="loading"
          @click="emit('reroll')"
        />
        <div class="flex -space-x-2">
          <UAvatar
            v-for="player in results.players"
            :key="player.steamId"
            :src="player.avatarUrl"
            :alt="player.name"
            :title="`${player.name} — ${player.gameCount} games`"
            size="lg"
            class="ring-2 ring-bg"
          />
        </div>
      </div>
    </div>

    <UCard class="mt-6">
      <template #header>
        <div>
          <h3 class="font-semibold text-highlighted">Your group’s shared taste</h3>
          <p class="mt-1 text-sm text-muted">Inferred from a random sample of each person’s library. Every source game is weighted equally.</p>
        </div>
      </template>
      <div class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <div v-for="genre in results.tasteProfile" :key="genre.name">
          <div class="mb-2 flex justify-between text-sm"><span>{{ genre.name }}</span><span class="text-muted">{{ genre.score }}%</span></div>
          <UProgress :model-value="genre.score" size="sm" />
        </div>
      </div>
    </UCard>

    <div class="mt-6 space-y-3">
      <UAlert v-for="warning in results.warnings" :key="warning" :description="warning" icon="i-lucide-info" color="warning" variant="soft" />
    </div>

    <div v-if="results.games.length" class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem]">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Search recommendations" class="w-full" />
      <USelectMenu
        v-model="excludedSimilarTo"
        :items="similarToItems"
        value-key="value"
        multiple
        icon="i-lucide-list-filter"
        placeholder="Hide games similar to..."
        aria-label="Hide recommendations similar to selected games"
        class="w-full"
      >
        <template #default>
          {{ excludedSimilarTo.length ? `Hiding ${excludedSimilarTo.length} ${excludedSimilarTo.length === 1 ? 'source game' : 'source games'}` : 'Hide games similar to...' }}
        </template>
      </USelectMenu>
      <USelect v-model="sort" :items="sortItems" value-key="value" class="w-full" />
    </div>

    <div v-if="visibleGames.length" class="mt-6 grid gap-5 md:grid-cols-2">
      <HomeGameCard
        v-for="game in visibleGames"
        :key="game.appId"
        :game="game"
        :player-count="results.players.length"
      />
    </div>

    <UCard v-else-if="results.games.length" class="mt-6 text-center">
      <UIcon name="i-lucide-search-x" class="mx-auto size-8 text-dimmed" />
      <p class="mt-3 font-medium">No recommendations match those filters.</p>
      <UButton label="Clear filters" color="neutral" variant="link" @click="emit('clearFilters')" />
    </UCard>

    <div v-if="results.games.length" class="mt-10 flex justify-center border-t border-default pt-8">
      <UButton
        type="button"
        label="Reroll recommendations"
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        size="lg"
        :loading="rerolling"
        :disabled="loading"
        @click="emit('reroll')"
      />
    </div>
  </section>
</template>
