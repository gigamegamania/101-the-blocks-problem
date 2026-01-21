<script setup lang="ts">
import { ref } from 'vue';
import Result from './Result.vue';
import { validate } from './validation';

const inputValue = ref<string>('');
const apiResponse = ref<{ solution?: string; error?: string } | null>(null);
const isLoading = ref<boolean>(false);

const handleInputChange = async (_e: Event): Promise<void> => {
  if (!inputValue.value.trim()) {
    apiResponse.value = null;
    return;
  }

  const { valid, error } = await validate(inputValue.value);
  if (!valid) {
    apiResponse.value = { error };
    return;
  }

  isLoading.value = true;
  try {
    const response = await fetch('http://localhost:5170/blocks/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: inputValue.value }),
    });
    const data = (await response.json()) as { solution?: string; error?: string };
    apiResponse.value = data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiResponse.value = { error: `Error: ${errorMessage}` };
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="app">
    <header>
      <h1>Technical Test App</h1>
    </header>

    <main>
      <div>
        <h2>Sample input:</h2>
        <pre>
5
move 2 over 1
move 3 over 2
pile 1 onto 0
quit
        </pre>
      </div>
      <div class="input-container">
        <label for="textbox">Enter text:</label>
        <textarea
          id="textbox"
          v-model="inputValue"
          placeholder="Type something..."
          class="text-input"
          rows="10"
          @input="handleInputChange"
        ></textarea>
      </div>

      <div v-if="isLoading" class="status">Loading...</div>
      <Result v-else-if="apiResponse" :api-response="apiResponse" />
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  color: #42b883;
}

.input-container {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: monospace;
  resize: vertical;
}

.text-input:focus {
  outline: none;
  border-color: #42b883;
}

.status {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.status {
  background-color: #f0f0f0;
  color: #666;
}
</style>
