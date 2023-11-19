<template>
  <div
    v-if="!trezorConnected"
    class="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-80"
  >
    <div
      class="w-screen max-w-lg p-4 text-red-900 border border-red-100 rounded-md shadow-sm bg-red-50"
    >
      <p class="font-bold">Trezor disconnected before signature validation.</p>
      <p class="text-sm">Please recconect it.</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Ref } from 'vue';
import { toRef } from 'vue';

interface Props {
  trezorConnected: boolean;
}

const props = defineProps<Props>();
const trezorConnected: Ref<boolean> = toRef(props, 'trezorConnected');
</script>
