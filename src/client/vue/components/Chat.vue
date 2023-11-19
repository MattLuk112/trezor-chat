<template>
  <div
    class="relative flex flex-col w-full max-w-xl border border-gray-200 rounded-lg shadow-lg h-4/5"
  >
    <ConnectionStatus :connected="connected" />
    <Identifications
      :connected="connected"
      :guest-identification="guestIdentification"
      :guest-verification="guestVerification"
      :identification="identification"
    />
    <!-- Chat window -->
    <div
      class="flex flex-col-reverse flex-grow px-2 overflow-y-auto text-xs no-scrollbar"
    >
      <!-- Typing animation -->
      <div v-if="oppositeIsTyping" class="my-1">
        <div
          class="inline-flex items-center p-2 space-x-1.5 bg-gray-100 rounded-md"
        >
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
      </div>
      <!-- Messages -->
      <div
        v-for="(message, index) in messages.slice().reverse()"
        :key="index"
        class="flex my-1"
        :class="{
          'justify-end': message.author === Authors.Me,
        }"
      >
        <div
          class="p-2 rounded-md"
          :class="{
            'bg-gray-100': message.author === Authors.Opposite,
            'bg-emerald-500': message.author === Authors.Me,
          }"
        >
          {{ message.text }}
        </div>
      </div>
    </div>
    <!-- Input and send button for new message -->
    <div class="flex items-center p-2 space-x-4">
      <input
        type="text"
        v-model="message"
        class="block w-full p-2 text-xs text-gray-900 border-0 rounded-md shadow-sm outline-none ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500"
        placeholder="Your message..."
        @input="handleTyping"
        @keyup.enter="sendMessage"
      />
      <button
        type="button"
        :class="{
          'text-gray-100': !message,
          'text-gray-300 hover:text-emerald-500': message,
        }"
        @click="sendMessage"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="w-6 h-6"
        >
          <path
            d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"
          />
        </svg>
      </button>
    </div>
  </div>
  <DisconnectedModal :trezor-connected="trezorConnected" />
</template>
<script setup lang="ts">
import { Authors, Identification, Message, Network } from './../../types';
import { ref, toRef } from 'vue';
import type { Ref } from 'vue';
import type { DataConnection, Peer as PeerType, PeerError } from 'peerjs';
import { Peer } from 'peerjs';
import ConnectionStatus from './partials/ConnectionStatus.vue';
import DisconnectedModal from './partials/DisconnectedModal.vue';
import Identifications from './partials/Identifications.vue';
import { handleError } from './../composables/errorHandling';

import TrezorConnect, {
  DEVICE,
  DEVICE_EVENT,
  DeviceEvent,
} from '@trezor/connect-web';

interface Props {
  identification: Identification;
  chatId: string;
  network: Network;
}

const props = defineProps<Props>();
const identification: Ref<Identification> = toRef(props, 'identification');
const guestIdentification: Ref<Identification | null> = ref(null);
const chatId: Ref<string> = toRef(props, 'chatId');
const network: Ref<Network> = toRef(props, 'network');

const messages: Ref<Array<Message>> = ref([]);
const message: Ref<string> = ref('');
const connected: Ref<boolean> = ref(false);
const isTyping: Ref<boolean> = ref(false);
const oppositeIsTyping: Ref<boolean> = ref(false);
let typingTimeout: ReturnType<typeof setTimeout> | null;
const guestVerification: Ref<string> = ref('');
const trezorConnected: Ref<boolean> = ref(true);
const trezorPath: Ref<string | undefined> = ref(
  identification.value.device?.path,
);

const peer: Ref<PeerType | null> = ref(null);
const remoteConnection: Ref<DataConnection | null> = ref(null);

const onTrezorDeviceEvent = (event: DeviceEvent) => {
  const { type, payload } = event;
  if (type !== DEVICE.CONNECT && type !== DEVICE.DISCONNECT) {
    return;
  }

  if (
    type === DEVICE.CONNECT &&
    payload.id &&
    payload.id === identification.value.device?.id
  ) {
    trezorPath.value = payload.path;
    trezorConnected.value = true;

    if (guestVerification.value === 'pending' && guestIdentification.value) {
      validateIdentification(guestIdentification.value);
    }
  }

  if (
    type === DEVICE.DISCONNECT &&
    payload.path &&
    payload.id === identification.value.device?.id
  ) {
    trezorConnected.value = false;
  }
};

TrezorConnect.on(DEVICE_EVENT, onTrezorDeviceEvent);

const startChat = () => {
  peer.value = new Peer(identification.value.id, {
    host: import.meta.env.VITE_PEER_SERVER_HOST,
    port: import.meta.env.VITE_PEER_SERVER_PORT,
    path: import.meta.env.VITE_PEER_SERVER_PATH,
  });

  peer.value.on('open', () => {
    registerListeners();
  });
};

const connectToChat = () => {
  peer.value = new Peer(identification.value.id, {
    host: import.meta.env.VITE_PEER_SERVER_HOST,
    port: import.meta.env.VITE_PEER_SERVER_PORT,
    path: import.meta.env.VITE_PEER_SERVER_PATH,
  });

  peer.value.on('open', () => {
    registerListeners(false);
  });
};

const sendMessage = () => {
  if (!message.value || !remoteConnection.value) {
    return;
  }

  if (typingTimeout) {
    clearTimeout(typingTimeout);
    isTyping.value = false;
    remoteConnection.value.send({ type: 'action', value: 'endTyping' });
  }

  remoteConnection.value.send({ type: 'message', value: message.value });
  handleMessage({
    author: Authors.Me,
    text: message.value,
  });
  message.value = '';
};

const registerListeners = (isChatStarter: boolean = true) => {
  if (!peer.value) {
    return;
  }

  peer.value.on('error', (error: PeerError<any>) => {
    console.log(error);
  });

  if (isChatStarter) {
    peer.value.on('connection', (connection: DataConnection) => {
      remoteConnection.value = connection;
      onConnectionOpen();
      onConnectionClose();
      onConnectionData();
    });
  } else {
    remoteConnection.value = peer.value.connect(chatId.value, {
      metadata: { ...identification.value },
    });
    onConnectionOpen();
    onConnectionClose();
    onConnectionData();
  }
};

const onConnectionOpen = () => {
  if (!remoteConnection.value) {
    handleError({ message: 'PeerJS remote connection not established!' });
    return;
  }

  remoteConnection.value.on('open', () => {
    connected.value = true;
    requestIdentification();
  });
};

const onConnectionClose = () => {
  if (!remoteConnection.value) {
    handleError({ message: 'PeerJS remote connection not established!' });
    return;
  }

  remoteConnection.value.on('close', () => {
    connected.value = false;
  });
};

const onConnectionData = () => {
  if (!remoteConnection.value) {
    handleError({ message: 'PeerJS remote connection not established!' });
    return;
  }

  remoteConnection.value.on('data', (data: any) => {
    if (data.type === 'message') {
      handleMessage({
        author: Authors.Opposite,
        text: data.value,
      });
    } else if (data.type === 'action') {
      handleAction(data);
    } else if (data.type === 'identification') {
      validateIdentification(data.value);
    }
  });
};

const handleMessage = (data: { author: Authors; text: string }) => {
  messages.value.push(data);
};

const handleAction = (data: { type: string; value: string }) => {
  if (data.value === 'startTyping') {
    oppositeIsTyping.value = true;
  } else if (data.value === 'endTyping') {
    oppositeIsTyping.value = false;
  } else if (data.value === 'requestIdentification') {
    sendIdentification();
  }
};

const requestIdentification = () => {
  if (!remoteConnection.value) {
    handleError({ message: 'PeerJS remote connection not established!' });
    return;
  }

  remoteConnection.value.send({
    type: 'action',
    value: 'requestIdentification',
  });
};

const sendIdentification = () => {
  if (!remoteConnection.value) {
    handleError({ message: 'PeerJS remote connection not established!' });
    return;
  }

  remoteConnection.value.send({
    type: 'identification',
    value: identification.value,
  });
};

const validateIdentification = (validatingIdentification: Identification) => {
  guestVerification.value = 'pending';
  guestIdentification.value = validatingIdentification;

  if (trezorConnected.value) {
    TrezorConnect.verifyMessage({
      address: validatingIdentification.address,
      coin: network.value,
      device: {
        path: trezorPath.value,
      },
      keepSession: false,
      message: 'I wanna chat!',
      signature: validatingIdentification.signature,
    })
      .then(({ success, payload }) => {
        if (!success) {
          handleError({ message: payload.error });
          guestVerification.value = 'invalid';
          return;
        }

        guestVerification.value = 'valid';
        TrezorConnect.off(DEVICE_EVENT, onTrezorDeviceEvent);
      })
      .catch(() => {
        handleError({ message: 'Network error' });
      });
  }
};

const handleTyping = () => {
  if (!remoteConnection.value) {
    return;
  }

  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }

  if (!isTyping.value) {
    isTyping.value = true;
    remoteConnection.value.send({ type: 'action', value: 'startTyping' });
  }

  typingTimeout = setTimeout(() => {
    isTyping.value = false;
    remoteConnection.value?.send({ type: 'action', value: 'endTyping' });
  }, 800);
};

window.addEventListener('beforeunload', () => {
  if (remoteConnection.value) {
    remoteConnection.value.close();
  }
});

if (identification.value.connecting) {
  connectToChat();
} else {
  startChat();
}
</script>
