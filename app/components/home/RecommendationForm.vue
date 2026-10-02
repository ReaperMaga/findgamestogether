<script setup lang="ts">
import { STEAM_GENRES, type SteamGenre } from '~~/shared/types/steam'

const props = defineProps<{
  profiles: string[]
  selectedGenres: SteamGenre[]
  errorMessage: string
  loading: boolean
  canSubmit: boolean
}>()

const emit = defineEmits<{
  'update:profiles': [profiles: string[]]
  'update:selectedGenres': [genres: SteamGenre[]]
  'submit': []
}>()

const filledCount = computed(() => props.profiles.filter(profile => profile.trim()).length)

function updateProfile(index: number, value: string | number) {
  const profiles = [...props.profiles]
  profiles[index] = String(value)
  emit('update:profiles', profiles)
}

async function addProfile() {
  if (props.profiles.length >= 6) return
  emit('update:profiles', [...props.profiles, ''])
  await nextTick()
  document.querySelector<HTMLInputElement>(`#player-${props.profiles.length}`)?.focus()
}

function removeProfile(index: number) {
  if (props.profiles.length > 2) {
    emit('update:profiles', props.profiles.filter((_, profileIndex) => profileIndex !== index))
  }
}

function toggleGenre(genre: SteamGenre) {
  const genres = props.selectedGenres.includes(genre)
    ? props.selectedGenres.filter(selectedGenre => selectedGenre !== genre)
    : [...props.selectedGenres, genre]

  emit('update:selectedGenres', genres)
}
</script>

<template>
  <form class="flex flex-col gap-8" aria-label="Players and preferences" @submit.prevent="emit('submit')">
    <ol class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="(_, index) in profiles"
        :key="index"
        :class="[`seat-${index + 1}`, { ready: profiles[index]?.trim() }]"
        class="slot relative flex flex-col gap-3 overflow-hidden rounded-md border border-default bg-(--panel) p-3 pt-4 sm:gap-4 sm:p-4 sm:pt-5"
      >
        <span class="slot-bar absolute inset-x-0 top-0 h-1 bg-(--pc)" aria-hidden="true" />
        <div class="flex items-start justify-between gap-3">
          <label :for="`player-${index}`" class="flex items-baseline gap-2.5">
            <span class="font-display text-3xl text-(--pc) sm:text-4xl">P{{ index + 1 }}</span>
            <span class="text-sm text-muted">{{ index === 0 ? 'You' : `Player ${index + 1}` }}</span>
          </label>
          <span v-if="profiles[index]?.trim()" class="font-tag ml-auto flex items-center gap-1 text-sm text-(--pc)">
            <UIcon name="i-lucide-check" class="size-4" />Ready
          </span>
          <UButton
            v-if="profiles.length > 2"
            type="button"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            square
            class="-mr-1.5 -mt-1.5"
            :aria-label="`Remove player ${index + 1}`"
            @click="removeProfile(index)"
          />
        </div>
        <UInput
          :id="`player-${index}`"
          :model-value="profiles[index]"
          icon="i-simple-icons-steam"
          placeholder="Profile URL, SteamID64 or name"
          size="lg"
          class="w-full"
          autocomplete="off"
          spellcheck="false"
          required
          @update:model-value="updateProfile(index, $event)"
        />
      </li>

      <li v-if="profiles.length < 6">
        <button
          type="button"
          class="group flex h-full min-h-34 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-accented text-muted transition-colors duration-200 hover:border-(--ui-text-muted) hover:text-highlighted"
          @click="addProfile"
        >
          <UIcon name="i-lucide-plus" class="size-6 transition-transform duration-300 ease-out-expo group-hover:rotate-90" />
          <span class="font-tag text-lg">Add player {{ profiles.length + 1 }}</span>
          <span class="text-xs text-dimmed">Up to 6 players</span>
        </button>
      </li>
    </ol>

    <div class="grid gap-8 border-t border-default pt-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <fieldset class="flex flex-col gap-4">
        <legend class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="font-tag text-xl text-highlighted">Narrow by genre</span>
          <span class="text-sm text-muted">Optional. Your shared taste is worked out automatically.</span>
        </legend>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="genre in STEAM_GENRES"
            :key="genre"
            type="button"
            class="genre font-tag rounded-sm border px-3 py-1.5 text-sm transition-colors duration-150"
            :aria-pressed="selectedGenres.includes(genre)"
            @click="toggleGenre(genre)"
          >
            {{ genre }}
          </button>
        </div>
        <p class="flex items-start gap-2 text-sm text-muted">
          <UIcon name="i-lucide-route" class="mt-0.5 size-4 shrink-0" />
          <span>We start from each player’s most-played games, follow Steam’s similar-game picks and rank what overlaps. Nobody needs to own the same games.</span>
        </p>
        <p class="-mt-2 flex items-start gap-2 text-sm text-muted">
          <UIcon name="i-lucide-lock-keyhole" class="mt-0.5 size-4 shrink-0" />
          <span>Every profile needs <strong class="font-semibold text-toned">Game details</strong> set to Public in Steam’s privacy settings. Only public library data is read.</span>
        </p>
      </fieldset>

      <div class="flex flex-col justify-end gap-3">
        <UAlert
          v-if="errorMessage"
          :description="errorMessage"
          icon="i-lucide-circle-alert"
          color="neutral"
          variant="outline"
          role="alert"
        />
        <UButton
          type="submit"
          color="neutral"
          variant="solid"
          size="xl"
          block
          :loading="loading"
          :disabled="!canSubmit"
          class="h-16 justify-between px-5"
        >
          <span class="font-display text-[1.75rem]">{{ loading ? 'Reading libraries' : 'Find games' }}</span>
          <template #trailing>
            <span v-if="!loading" class="flex items-center gap-2 text-sm font-semibold">
              {{ filledCount }}/{{ profiles.length }} ready
              <UIcon name="i-lucide-arrow-right" class="size-5" />
            </span>
          </template>
        </UButton>
        <p class="text-xs text-dimmed">Not quite right? Reroll for a new set built from different favorites.</p>
      </div>
    </div>
  </form>
</template>

<style scoped>
.slot-bar {
  transform-origin: left;
  animation: bar-wipe 600ms var(--ease-out-expo) both;
}

.slot.ready {
  border-color: color-mix(in oklab, var(--pc) 45%, var(--ui-border));
}

.slot:focus-within {
  border-color: var(--pc);
}

.genre {
  border-color: var(--ui-border-accented);
  color: var(--ui-text-toned);
}

.genre:hover {
  border-color: var(--ui-text-muted);
  color: var(--ui-text-highlighted);
}

.genre[aria-pressed='true'] {
  border-color: var(--ui-bg-inverted);
  background: var(--ui-bg-inverted);
  color: var(--ui-text-inverted);
}
</style>
