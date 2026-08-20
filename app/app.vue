<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  htmlAttrs: { lang: 'en' }
})

const title = 'Find Games Together'
const description = 'Get multiplayer game recommendations based on what your group actually plays.'

useSeoMeta({ title, titleTemplate: title, description, ogTitle: title, ogDescription: description, twitterCard: 'summary' })
</script>

<template>
  <UApp>
    <UMain><NuxtPage /></UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">Game recommendations based on public Steam data.</p>
      </template>
    </UFooter>
  </UApp>
</template>
