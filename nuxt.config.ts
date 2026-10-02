// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui'
  ],

  ui: {
    fonts: false
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark'
  },

  runtimeConfig: {
    steamApiKey: ''
  },

  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: false,
      nodeCompat: true
    }
  },

  devtools: {
    enabled: true
  },

  css: ['@fontsource-variable/archivo/wdth.css', '~/assets/css/main.css'],

  compatibilityDate: '2026-08-21'
})
