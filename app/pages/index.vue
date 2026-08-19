<script setup lang="ts">
import { STEAM_GENRES, type RecommendationRequest, type RecommendationsResponse, type SteamGenre } from '~~/shared/types/steam'

type SortOption = 'best' | 'rating' | 'least-owned' | 'most-owned'

const sortItems: Array<{ label: string, value: SortOption }> = [
  { label: 'Best match', value: 'best' },
  { label: 'Highest rated', value: 'rating' },
  { label: 'Least owned', value: 'least-owned' },
  { label: 'Most owned', value: 'most-owned' }
]

const profiles = ref(['', ''])
const selectedGenres = ref<SteamGenre[]>([])
const results = ref<RecommendationsResponse | null>(null)
const loading = ref(false)
const rerolling = ref(false)
const errorMessage = ref('')
const search = ref('')
const sort = ref<SortOption>('best')
const excludedSimilarTo = ref<string[]>([])
const seenGameIds = ref<number[]>([])

const canSubmit = computed(() => profiles.value.length >= 2 && profiles.value.every(profile => profile.trim()) && !loading.value && !rerolling.value)
const similarToItems = computed(() => [...new Set(
  (results.value?.games || []).flatMap(game => game.similarTo)
)].sort().map(name => ({ label: name, value: name })))
const visibleGames = computed(() => {
  const query = search.value.trim().toLowerCase()
  const excludedSources = new Set(excludedSimilarTo.value)
  const games = (results.value?.games || []).filter(game =>
    (!query || game.name.toLowerCase().includes(query) || game.genres.some(genre => genre.toLowerCase().includes(query)))
    && !game.similarTo.some(sourceGame => excludedSources.has(sourceGame))
  )

  return games.toSorted((a, b) => {
    if (sort.value === 'rating') return (b.metacritic || 0) - (a.metacritic || 0)
    if (sort.value === 'least-owned') return a.ownedByCount - b.ownedByCount || b.score - a.score
    if (sort.value === 'most-owned') return b.ownedByCount - a.ownedByCount || b.score - a.score
    return b.score - a.score
  })
})

onMounted(() => {
  try {
    const saved = localStorage.getItem('find-games-together-form')
    if (!saved) return
    const parsed = JSON.parse(saved) as { profiles?: unknown, genres?: unknown }
    if (Array.isArray(parsed.profiles) && parsed.profiles.length >= 2 && parsed.profiles.length <= 6) {
      profiles.value = parsed.profiles.map(String)
    }
    if (Array.isArray(parsed.genres)) {
      selectedGenres.value = parsed.genres.filter((genre): genre is SteamGenre => STEAM_GENRES.includes(genre as SteamGenre))
    }
  } catch {
    localStorage.removeItem('find-games-together-form')
  }
})

watch([profiles, selectedGenres], () => {
  if (!import.meta.client) return
  localStorage.setItem('find-games-together-form', JSON.stringify({ profiles: profiles.value, genres: selectedGenres.value }))
}, { deep: true })

function addProfile() {
  if (profiles.value.length < 6) profiles.value.push('')
}

function removeProfile(index: number) {
  if (profiles.value.length > 2) profiles.value.splice(index, 1)
}

function toggleGenre(genre: SteamGenre) {
  selectedGenres.value = selectedGenres.value.includes(genre)
    ? selectedGenres.value.filter(selectedGenre => selectedGenre !== genre)
    : [...selectedGenres.value, genre]
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const data = 'data' in error ? error.data : undefined
    if (data && typeof data === 'object' && 'statusMessage' in data && typeof data.statusMessage === 'string') return data.statusMessage
    if ('statusMessage' in error && typeof error.statusMessage === 'string') return error.statusMessage
    if ('message' in error && typeof error.message === 'string') return error.message
  }
  return 'Something went wrong while analyzing these Steam profiles. Please try again.'
}

function clearResultFilters() {
  search.value = ''
  excludedSimilarTo.value = []
}

async function loadRecommendations(excludedAppIds: number[], reroll = false) {
  if (loading.value || rerolling.value) return
  if (reroll) rerolling.value = true
  else loading.value = true
  errorMessage.value = ''
  if (!reroll) {
    results.value = null
    seenGameIds.value = []
  }

  const request: RecommendationRequest = {
    profiles: profiles.value.map(profile => profile.trim()),
    genres: selectedGenres.value,
    excludedAppIds
  }

  try {
    const nextResults = await $fetch<RecommendationsResponse>('/api/steam/recommendations', { method: 'POST', body: request })
    results.value = nextResults
    seenGameIds.value = [...new Set([...seenGameIds.value, ...nextResults.games.map(game => game.appId)])]
    clearResultFilters()
    await nextTick()
    document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    if (reroll) rerolling.value = false
    else loading.value = false
  }
}

async function findGames() {
  if (!canSubmit.value) return
  await loadRecommendations([])
}

async function rerollGames() {
  if (!results.value?.games.length) return
  await loadRecommendations(seenGameIds.value, true)
}

</script>

<template>
  <UContainer class="py-12 sm:py-16">
    <section class="mx-auto max-w-3xl">
      <UBadge label="Steam taste matcher" color="neutral" variant="soft" />
      <h1 class="mt-4 text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">Find a game your group will like</h1>
      <p class="mt-4 max-w-2xl text-lg leading-8 text-muted">
        We sample games from each person’s library to find multiplayer titles with similar Steam tags.
      </p>
    </section>

    <UCard class="mx-auto mt-10 max-w-3xl">
      <template #header>
        <div>
          <h2 class="text-lg font-semibold text-highlighted">Add Steam profiles</h2>
          <p class="mt-1 text-sm text-muted">Use a profile URL, SteamID64, or vanity name. You can compare up to six people.</p>
        </div>
      </template>

      <form class="space-y-6" @submit.prevent="findGames">
        <div class="space-y-4">
          <div v-for="(_, index) in profiles" :key="index" class="flex items-end gap-2">
            <UFormField :label="index === 0 ? 'Your profile' : `Friend ${index}`" class="min-w-0 flex-1" required>
              <UInput v-model="profiles[index]" icon="i-simple-icons-steam" placeholder="https://steamcommunity.com/id/username" size="lg" class="w-full" />
            </UFormField>
            <UButton v-if="profiles.length > 2" type="button" icon="i-lucide-trash-2" color="neutral" variant="ghost" size="lg" square :aria-label="`Remove player ${index + 1}`" @click="removeProfile(index)" />
          </div>

          <UButton v-if="profiles.length < 6" type="button" label="Add another person" icon="i-lucide-plus" color="neutral" variant="soft" @click="addProfile" />
        </div>

        <USeparator />

        <UFormField
          label="Optional genre preference"
          description="Your shared taste is inferred automatically. Select genres only if you want to narrow the recommendations."
        >
          <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="Genre preferences">
            <UButton
              v-for="genre in STEAM_GENRES"
              :key="genre"
              type="button"
              :label="genre"
              :icon="selectedGenres.includes(genre) ? 'i-lucide-check' : undefined"
              :color="selectedGenres.includes(genre) ? 'primary' : 'neutral'"
              :variant="selectedGenres.includes(genre) ? 'soft' : 'outline'"
              size="sm"
              class="rounded-full"
              :aria-pressed="selectedGenres.includes(genre)"
              @click="toggleGenre(genre)"
            />
          </div>
        </UFormField>

        <UAlert
          title="Steam privacy setting"
          description="Every profile must have Game details set to Public. We only read public library data."
          icon="i-lucide-lock-keyhole"
          color="neutral"
          variant="soft"
        />

        <UAlert v-if="errorMessage" :description="errorMessage" icon="i-lucide-circle-alert" color="error" variant="soft" />

        <UButton
          type="submit"
          label="Get recommendations"
          icon="i-lucide-search"
          size="lg"
          block
          :loading="loading"
          :disabled="!canSubmit"
        />
      </form>
    </UCard>

    <section v-if="results" id="results" class="mx-auto mt-16 max-w-5xl scroll-mt-24" aria-live="polite">
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
            @click="rerollGames"
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
        <UCard v-for="game in visibleGames" :key="game.appId" class="overflow-hidden" :ui="{ body: 'p-0 sm:p-0' }">
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
              <UBadge v-for="genre in game.genres.slice(0, 4)" :key="genre" :label="genre" :color="game.genreMatches.includes(genre) ? 'primary' : 'neutral'" variant="subtle" />
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
                <span>{{ game.ownedByCount }}/{{ results.players.length }} own</span>
                <span v-if="game.metacritic">{{ game.metacritic }} Metacritic</span>
                <span v-if="game.free">Free</span>
              </div>
              <UButton :href="game.storeUrl" target="_blank" label="Steam" trailing-icon="i-lucide-external-link" color="neutral" variant="ghost" />
            </div>
          </div>
        </UCard>
      </div>

      <UCard v-else-if="results.games.length" class="mt-6 text-center">
        <UIcon name="i-lucide-search-x" class="mx-auto size-8 text-dimmed" />
        <p class="mt-3 font-medium">No recommendations match those filters.</p>
        <UButton label="Clear filters" color="neutral" variant="link" @click="clearResultFilters" />
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
          @click="rerollGames"
        />
      </div>
    </section>
  </UContainer>
</template>
