<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <h2 class="section-header">{{ label }}</h2>
</template>

<style scoped>
.section-header {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #42b883;
}
</style>
