<script setup>
const { loggedIn } = useAuth()
</script>

<template>
  <div>
    <pre v-if="loggedIn">User is authenticated</pre>
  </div>
</template>
