<template>
  <button
    class="flex items-center pr-2 font-bold cursor-pointer justify-self-end text-emerald-500 hover:text-emerald-800"
  >
    <p><slot /></p>
    <svg
      v-if="showIcon"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-6 h-6"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  </button>
</template>
<script setup lang="ts">
import type { Ref } from 'vue';
import { toRef } from 'vue';
interface Props {
  icon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  icon: true,
});

const showIcon: Ref<boolean> = toRef(props, 'icon');
</script>
