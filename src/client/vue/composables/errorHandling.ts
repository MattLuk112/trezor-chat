import type { Ref } from 'vue';
import { ref } from 'vue';

interface Error {
  message: string;
}

let errorTimeout: ReturnType<typeof setTimeout> | null;

export const currentError: Ref<Error | null> = ref(null);

export const handleError = (error: Error) => {
  currentError.value = error;

  if (errorTimeout) {
    clearTimeout(errorTimeout);
  }

  errorTimeout = setTimeout(() => {
    currentError.value = null;
  }, 5000);
};
