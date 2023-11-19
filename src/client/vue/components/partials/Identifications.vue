<template>
  <div
    class="text-xs bg-gray-100 border-t border-b border-gray-300 divide-y divide-gray-200"
  >
    <div class="flex items-center justify-between p-2">
      <p class="w-1/5 font-bold">Me</p>
      <p>{{ identification.address }}</p>
      <p class="w-1/5 text-right">
        <span class="font-bold text-emerald-500">Valid signature</span>
      </p>
    </div>
    <div
      v-if="connected && guestIdentification"
      class="flex items-center justify-between p-2"
    >
      <p class="w-1/5 font-bold">Guest</p>
      <p>{{ guestIdentification.address }}</p>
      <p class="w-1/5 text-right">
        <span
          v-if="guestVerification === 'pending'"
          class="font-bold text-yellow-500"
          >Pending validation</span
        >
        <span
          v-else-if="guestVerification === 'valid'"
          class="font-bold text-emerald-500"
          >Valid signature</span
        >
        <span
          v-else-if="guestVerification === 'invalid'"
          class="font-bold text-red-500"
          >Invalid signature</span
        >
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Ref } from 'vue';
import { toRef } from 'vue';
import { Identification } from '../../../types';

interface Props {
  connected: boolean;
  guestIdentification: Identification | null;
  guestVerification: string;
  identification: Identification;
}

const props = defineProps<Props>();

const connected: Ref<boolean> = toRef(props, 'connected');
const guestIdentification: Ref<Identification | null> = toRef(
  props,
  'guestIdentification',
);
const guestVerification: Ref<string> = toRef(props, 'guestVerification');
</script>
