<script setup lang="ts">
defineProps({
  apiResponse: {
    type: Object as () => { solution?: string; error?: string },
    required: true,
  },
});
</script>

<template>
  <div class="result">
    <div v-if="apiResponse.solution" class="success">
      <pre>{{ apiResponse.solution }}</pre>
    </div>
    <div v-if="apiResponse.error" class="error">
      <pre>{{ apiResponse.error }}</pre>
    </div>
  </div>
</template>

<style scoped>
.result > div {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.result .success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.result .error {
  background-color: #ffebee;
  color: #c62828;
}

.result pre {
  margin: 0;
  font-family: monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
