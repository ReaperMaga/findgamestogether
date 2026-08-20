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

function updateProfile(index: number, value: string | number) {
  const profiles = [...props.profiles]
  profiles[index] = String(value)
  emit('update:profiles', profiles)
}

function addProfile() {
  if (props.profiles.length < 6) emit('update:profiles', [...props.profiles, ''])
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
  <UCard class="mx-auto mt-10 max-w-3xl">
    <template #header>
      <div>
        <h2 class="text-lg font-semibold text-highlighted">Add Steam profiles</h2>
        <p class="mt-1 text-sm text-muted">Use a profile URL, SteamID64, or vanity name. You can compare up to six people.</p>
      </div>
    </template>

    <form class="space-y-6" @submit.prevent="emit('submit')">
      <div class="space-y-4">
        <div v-for="(_, index) in profiles" :key="index" class="flex items-end gap-2">
          <UFormField :label="index === 0 ? 'Your profile' : `Friend ${index}`" class="min-w-0 flex-1" required>
            <UInput
              :model-value="profiles[index]"
              icon="i-simple-icons-steam"
              placeholder="https://steamcommunity.com/id/username"
              size="lg"
              class="w-full"
              @update:model-value="updateProfile(index, $event)"
            />
          </UFormField>
          <UButton
            v-if="profiles.length > 2"
            type="button"
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            size="lg"
            square
            :aria-label="`Remove player ${index + 1}`"
            @click="removeProfile(index)"
          />
        </div>

        <UButton
          v-if="profiles.length < 6"
          type="button"
          label="Add another person"
          icon="i-lucide-plus"
          color="neutral"
          variant="soft"
          @click="addProfile"
        />
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
</template>
