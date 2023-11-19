<template>
  <div
    class="p-2 text-sm font-bold text-center border-t border-b border-r border-gray-300 rounded-tl-md rounded-tr-md"
    :class="{
      'bg-green-500 text-green-900': connected,
      'bg-red-500 text-red-900': !connected,
    }"
  >
    {{ connected ? 'Connected' : 'Disconnected' }}
  </div>
</template>
<script setup lang="ts">
import type { Ref } from 'vue';
import { toRef } from 'vue';

interface Props {
  connected: boolean;
}

const props = defineProps<Props>();
const connected: Ref<boolean> = toRef(props, 'connected');
</script>
