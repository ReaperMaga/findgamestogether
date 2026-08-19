// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/kinde',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/**': {
      appMiddleware: ['auth-logged-in'],
      kinde: {
        redirectUrl: '/api/login',
        external: true
      }
    }
  },

  compatibilityDate: '2026-06-30'
})
