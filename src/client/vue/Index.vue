<template>
  <div class="flex flex-col w-screen h-screen p-12">
    <h1 class="text-4xl text-center text-gray-900">Peer 2 peer Trezor chat</h1>
    <div class="flex items-center justify-center flex-grow">
      <p
        v-if="!trezorConnectInitialized"
        class="text-sm font-bold text-gray-500"
      >
        Initializing Trezor connect
      </p>
      <template v-else>
        <template v-if="!chatPrepared">
          <NetworkSelect
            v-if="!isConnecting && !network && !chatPrepared"
            @select="(result) => (network = result)"
          />
          <Authenticate
            v-if="network"
            :network="network"
            :connecting="isConnecting"
            @done="authenticated"
          />
        </template>
        <Chat
          v-else-if="chatPrepared && identification && network"
          :identification="identification"
          :chat-id="chatId"
          :network="network"
        />
      </template>
    </div>
  </div>
  <ErrorAlert />
</template>
<script setup lang="ts">
import { Identification, Network } from './../types';
import type { Ref } from 'vue';
import { ref } from 'vue';
import TrezorConnect from '@trezor/connect-web';
import Authenticate from './components/Authenticate.vue';
import Chat from './components/Chat.vue';
import ErrorAlert from './components/partials/ErrorAlert.vue';
import NetworkSelect from './components/NetworkSelect.vue';
import { handleError } from './composables/errorHandling';

const trezorConnectInitialized: Ref<boolean> = ref(false);

const network: Ref<Network | null> = ref(null);
const identification: Ref<Identification | null> = ref(null);

const chatPrepared: Ref<boolean> = ref(false);
const chatId: Ref<string> = ref(
  new URLSearchParams(window.location.search).get('c') ?? '',
);
const isConnecting: Ref<boolean> = ref(chatId.value ? true : false);

TrezorConnect.init({
  debug: import.meta.env.VITE_TREZOR_DEBUG ?? false,
  lazyLoad: false,
  manifest: {
    email: import.meta.env.VITE_TREZOR_MANIFEST_EMAIL,
    appUrl: import.meta.env.VITE_TREZOR_MANIFEST_URL,
  },
})
  .then(() => {
    trezorConnectInitialized.value = true;
  })
  .catch((error) => {
    handleError({ message: error.message });
  });

if (isConnecting.value) {
  network.value =
    chatId.value.split('-')[0] === Network.Mainnet
      ? Network.Mainnet
      : Network.Testnet;
}

const authenticated = (payload: Identification) => {
  if (!payload.connecting) {
    window.history.replaceState(
      {},
      '',
      `${window.location.href}${window.location.search ? '&' : '?'}c=${
        payload.id
      }`,
    );
  }

  identification.value = payload;
  chatPrepared.value = true;
};
</script>
