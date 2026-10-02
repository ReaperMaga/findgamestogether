<script setup lang="ts">
import type { GameRecommendation, RecommendationsResponse } from '~~/shared/types/steam'

type SortOption = 'best' | 'rating' | 'least-owned' | 'most-owned'

const props = defineProps<{
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

const playerIndex = computed(() => Object.fromEntries(props.results.players.map((player, index) => [player.steamId, index])))

// Hover previews a player's ownership across every game; click pins it.
const hovered = ref<number | null>(null)
const pinned = ref<number | null>(null)
const spotlight = computed(() => hovered.value ?? pinned.value)

function togglePin(index: number) {
  pinned.value = pinned.value === index ? null : index
}

watch(() => props.results, () => {
  hovered.value = null
  pinned.value = null
})
</script>

<template>
  <section id="results" class="flex scroll-mt-6 flex-col gap-10" aria-labelledby="results-title" aria-live="polite">
    <header class="flex flex-col gap-6 border-t-2 border-inverted pt-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex flex-col gap-3">
          <h2 id="results-title" class="font-display text-[clamp(2.25rem,6vw,3.75rem)] text-highlighted">
            {{ results.games.length }} {{ results.games.length === 1 ? 'game' : 'games' }} for this lineup
          </h2>
          <p class="text-sm text-muted">
            Started from {{ results.sourceGameCount }} favorite games · {{ results.candidateGameCount }} similar games found · {{ results.analyzedGameCount }} checked
          </p>
        </div>
        <UButton
          v-if="results.games.length"
          type="button"
          label="Reroll"
          icon="i-lucide-dices"
          color="neutral"
          variant="outline"
          size="lg"
          class="self-start sm:self-auto"
          :loading="rerolling"
          :disabled="loading"
          @click="emit('reroll')"
        />
      </div>

      <ul class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2" aria-label="Players. Select one to highlight what they own.">
        <li v-for="(player, index) in results.players" :key="player.steamId" :class="`seat-${index + 1}`">
          <button
            type="button"
            class="player flex w-full items-center gap-3 rounded-md border border-default bg-(--panel) p-2 pr-3 text-left transition-colors duration-200 hover:border-(--pc)"
            :class="{ pinned: pinned === index }"
            :aria-pressed="pinned === index"
            @mouseenter="hovered = index"
            @mouseleave="hovered = null"
            @focus="hovered = index"
            @blur="hovered = null"
            @click="togglePin(index)"
          >
            <img :src="player.avatarUrl" :alt="''" class="size-10 shrink-0 rounded-sm outline-2 outline-offset-2 outline-(--pc)">
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold text-highlighted">{{ player.name }}</span>
              <span class="block text-xs text-muted">{{ player.gameCount }} games in library</span>
            </span>
            <span class="font-display text-2xl text-(--pc)">P{{ index + 1 }}</span>
          </button>
        </li>
      </ul>
    </header>

    <section v-if="results.tasteProfile.length" class="flex flex-col gap-5" aria-labelledby="taste-title">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 id="taste-title" class="font-tag text-xl text-highlighted">Shared taste</h3>
        <p class="text-sm text-muted">From the Steam tags of everyone’s most-played games.</p>
      </div>
      <ul class="grid gap-x-10 gap-y-3 sm:grid-cols-2">
        <li v-for="genre in results.tasteProfile" :key="genre.name" class="flex flex-col gap-1.5">
          <div class="flex justify-between text-sm"><span class="text-default">{{ genre.name }}</span><span class="text-muted">{{ genre.score }}%</span></div>
          <div class="h-1.5 overflow-hidden rounded-[1px] bg-accented">
            <div class="taste-fill h-full bg-inverted" :style="{ width: `${genre.score}%` }" />
          </div>
        </li>
      </ul>
    </section>

    <div v-if="results.warnings.length" class="flex flex-col gap-3">
      <UAlert v-for="warning in results.warnings" :key="warning" :description="warning" icon="i-lucide-info" color="neutral" variant="outline" />
    </div>

    <div v-if="results.games.length" class="flex flex-col gap-6">
      <div class="toolbar sticky top-0 z-10 -mx-4 grid gap-2 border-b border-default bg-default px-4 py-3 sm:mx-0 sm:grid-cols-2 sm:px-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem]">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Search by name or genre" aria-label="Search recommendations" class="w-full" />
        <USelectMenu
          v-model="excludedSimilarTo"
          :items="similarToItems"
          value-key="value"
          multiple
          icon="i-lucide-eye-off"
          placeholder="Hide games similar to…"
          aria-label="Hide recommendations similar to selected games"
          class="w-full"
        >
          <template #default>
            {{ excludedSimilarTo.length ? `Hiding ${excludedSimilarTo.length} ${excludedSimilarTo.length === 1 ? 'source game' : 'source games'}` : 'Hide games similar to…' }}
          </template>
        </USelectMenu>
        <USelect v-model="sort" :items="sortItems" value-key="value" icon="i-lucide-arrow-down-wide-narrow" aria-label="Sort recommendations" class="w-full" />
        <div class="flex flex-wrap items-center gap-1.5 sm:col-span-2 lg:col-span-3" role="group" aria-label="Highlight what one player owns">
          <span class="mr-1 text-xs text-muted">Highlight owner</span>
          <button
            v-for="(player, index) in results.players"
            :key="player.steamId"
            type="button"
            :class="`seat-${index + 1}`"
            class="seat-chip font-tag flex h-7 items-center rounded-sm border px-2 text-sm"
            :aria-pressed="pinned === index"
            :title="player.name"
            @click="togglePin(index)"
          >
            P{{ index + 1 }}<span class="sr-only"> {{ player.name }}</span>
          </button>
        </div>
      </div>

      <div v-if="visibleGames.length" :key="results.generatedAt" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <HomeGameCard
          v-for="(game, index) in visibleGames"
          :key="game.appId"
          :game="game"
          :rank="index + 1"
          :player-index="playerIndex"
          :spotlight="spotlight"
          :lead="index === 0"
          class="tile"
          :class="{ 'sm:col-span-2 xl:col-span-3': index === 0 }"
          :style="{ animationDelay: `${Math.min(index, 8) * 45}ms` }"
        />
      </div>

      <div v-else class="flex flex-col items-center gap-3 rounded-md border border-dashed border-accented px-6 py-12 text-center">
        <UIcon name="i-lucide-search-x" class="size-8 text-dimmed" />
        <p class="font-semibold text-highlighted">No games match those filters.</p>
        <UButton label="Clear filters" color="neutral" variant="outline" @click="emit('clearFilters')" />
      </div>
    </div>

    <div v-if="results.games.length" class="flex flex-col items-center gap-3 border-t border-default pt-10 text-center">
      <p class="font-tag text-2xl text-highlighted">Nothing grabbing you?</p>
      <p class="text-sm text-muted">Reroll starts from different favorite games and skips everything you’ve already seen.</p>
      <UButton
        type="button"
        label="Reroll recommendations"
        icon="i-lucide-dices"
        color="neutral"
        variant="solid"
        size="lg"
        :loading="rerolling"
        :disabled="loading"
        @click="emit('reroll')"
      />
    </div>
  </section>
</template>

<style scoped>
.player.pinned {
  border-color: var(--pc);
  background: var(--ui-bg-elevated);
}

.seat-chip {
  border-color: color-mix(in oklab, var(--pc) 60%, transparent);
  color: var(--pc);
}

.seat-chip[aria-pressed='true'] {
  background: var(--pc);
  border-color: var(--pc);
  color: var(--p-ink);
}

.tile {
  animation: rise-in 500ms var(--ease-out-expo) both;
}

.taste-fill {
  transform-origin: left;
  animation: bar-wipe 800ms var(--ease-out-expo) both;
}
</style>
