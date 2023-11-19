<template>
  <div class="flex items-center justify-center flex-grow space-x-8">
    <button
      type="button"
      class="px-4 py-2 text-2xl border rounded-md hover:bg-emerald-500 hover:text-emerald-100 hover:border-emerald-500"
      @click="emit('select', Network.Mainnet)"
    >
      Mainnet
    </button>
    <button
      type="button"
      class="px-4 py-2 text-2xl border rounded-md hover:bg-emerald-500 hover:text-emerald-100 hover:border-emerald-500"
      @click="emit('select', Network.Testnet)"
    >
      Testnet
    </button>
  </div>
</template>
<script setup lang="ts">
import { Network } from './../../types';

const emit = defineEmits(['select']);
</script>
