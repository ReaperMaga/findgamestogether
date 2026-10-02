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
    <header class="border-b border-default">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <NuxtLink to="/" class="flex items-center gap-2.5 rounded-sm text-highlighted">
          <AppMark class="size-6" />
          <span class="font-tag text-lg leading-none">Find Games Together</span>
        </NuxtLink>
        <UColorModeButton color="neutral" variant="ghost" />
      </div>
    </header>

    <UMain>
      <NuxtPage />
    </UMain>

    <footer class="border-t border-default">
      <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Game recommendations based on public Steam data.</p>
        <p class="text-dimmed">Rerolls start from different favorite games each time.</p>
      </div>
    </footer>
  </UApp>
</template>
