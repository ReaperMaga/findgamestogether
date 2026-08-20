<script setup lang="ts">
import { STEAM_GENRES, type RecommendationRequest, type RecommendationsResponse, type SteamGenre } from '~~/shared/types/steam'

type SortOption = 'best' | 'rating' | 'least-owned' | 'most-owned'

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
    <HomeHeroSection />

    <HomeRecommendationForm
      v-model:profiles="profiles"
      v-model:selected-genres="selectedGenres"
      :error-message="errorMessage"
      :loading="loading"
      :can-submit="canSubmit"
      @submit="findGames"
    />

    <HomeRecommendationResults
      v-if="results"
      v-model:search="search"
      v-model:excluded-similar-to="excludedSimilarTo"
      v-model:sort="sort"
      :results="results"
      :visible-games="visibleGames"
      :similar-to-items="similarToItems"
      :loading="loading"
      :rerolling="rerolling"
      @clear-filters="clearResultFilters"
      @reroll="rerollGames"
    />
  </UContainer>
</template>
