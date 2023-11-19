<template>
  <div class="w-full max-w-xl p-4 bg-white rounded-md shadow-lg">
    <div v-if="!devices.length" class="flex items-center space-x-2 text-sm">
      <p>Please connect your Trezor and</p>
      <SelectButton @click="selectAccount(null)">Select account</SelectButton>
    </div>
    <div v-else class="flex flex-col space-y-4">
      <div>
        <p class="pb-1">
          To {{ connecting ? 'connect to chat' : 'start a chat' }} please select
          account and address
        </p>
        <div
          v-for="trezor in devices"
          :key="trezor.path"
          class="flex items-center py-4 space-x-4 cursor-pointer"
          :class="{
            'border border-emerald-500 rounded-md bg-emerald-50':
              device && device.path === trezor.path,
          }"
        >
          <div class="p-2">
            <svg
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
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
          </div>
          <div class="flex flex-col flex-grow">
            <div>
              {{ trezor.name }}
            </div>
            <div class="text-xs font-bold">
              {{ trezor.label }}
            </div>
          </div>
          <SelectButton
            @click="selectAccount(trezor)"
            :icon="
              account && device && device.path === trezor.path ? false : true
            "
          >
            <p v-if="!account || (device && device.path !== trezor.path)">
              Select account
            </p>
            <p v-else>{{ account.type }} account #{{ account.number }}</p>
          </SelectButton>
        </div>
      </div>
      <template v-if="account">
        <div>
          <p class="pb-1 text-sm font-bold">Used addresses</p>
          <div
            class="overflow-y-auto text-sm divide-y divide-gray-100 shadow-inner max-h-28"
          >
            <div
              v-for="address in addresses.slice().reverse()"
              :key="address.address"
              class="p-2 space-x-4 cursor-pointer"
              :class="{
                'bg-emerald-50':
                  selectedAddress &&
                  selectedAddress.address === address.address,
                'hover:bg-gray-100':
                  !selectedAddress ||
                  selectedAddress.address !== address.address,
              }"
              @click="selectedAddress = address"
            >
              <span class="text-gray-300"
                >/{{ address.path.split('/').at(-1) }}</span
              >
              <span>{{ address.address }}</span>
            </div>
            <p
              v-if="!addresses.length"
              class="p-2 text-xs font-bold text-center"
            >
              No used addresses
            </p>
          </div>
        </div>
        <div>
          <button
            class="flex items-center text-sm font-bold text-emerald-500 hover:text-emerald-800"
            @click="getNewAddress"
          >
            Use fresh address
            <svg
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
        </div>
      </template>
      <div v-if="selectedAddress" class="flex items-center justify-center">
        <button
          class="px-4 py-2 border rounded-md border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-emerald-100"
          type="button"
          @click="submit"
        >
          {{ connecting ? 'Connect to chat' : 'Start chat' }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Account, Address, Device } from './../../types';
import type { Ref } from 'vue';
import { onUnmounted, toRef, ref } from 'vue';
import { faker } from '@faker-js/faker';
import TrezorConnect, {
  DEVICE_EVENT,
  DEVICE,
  DeviceEvent,
} from '@trezor/connect-web';
import { handleError } from './../composables/errorHandling';
import SelectButton from './partials/SelectButton.vue';

interface Props {
  network: string;
  connecting: boolean;
}

const emit = defineEmits(['done']);

const props = defineProps<Props>();
const network: Ref<string> = toRef(props, 'network');
const connecting: Ref<boolean> = toRef(props, 'connecting');

const devices: Ref<Device[]> = ref([]);
const device: Ref<Device | null> = ref(null);
const addresses: Ref<Address[]> = ref([]);
const account: Ref<Account | null> = ref(null);
const selectedAddress: Ref<Address | null> = ref(null);

const onTrezorDeviceEvent = (event: DeviceEvent) => {
  const { type, payload } = event;
  if (type === DEVICE.CONNECT) {
    const trezor = {
      id: payload.id,
      label: payload.label,
      name: payload.name,
      path: payload.path,
    };
    if (devices.value.length === 0) {
      device.value = trezor;
    }
    devices.value.push({
      id: payload.id,
      label: payload.label,
      name: payload.name,
      path: payload.path,
    });
  } else if (type === DEVICE.DISCONNECT) {
    devices.value = devices.value.filter((single) => single.id !== payload.id);
    device.value = null;
    addresses.value = [];
    account.value = null;
    selectedAddress.value = null;
  }
};

TrezorConnect.on(DEVICE_EVENT, onTrezorDeviceEvent);

const selectAccount = (trezor: Device | null) => {
  device.value = trezor;
  addresses.value = [];
  account.value = null;
  TrezorConnect.getAccountInfo({
    coin: network.value,
    device: {
      path: device.value?.path,
    },
    details: 'tokens',
    keepSession: true,
    tokens: 'used',
  })
    .then(({ success, payload }) => {
      if (!success) {
        device.value = null;
        handleError({ message: payload.error });
        return;
      }

      if (payload.path) {
        resolveAccount(payload.path);
      }

      if (payload.addresses) {
        const { used } = payload.addresses;
        addresses.value = used.map((single) => {
          return {
            address: single.address,
            path: single.path,
          };
        });
      }
    })
    .catch((error) => {
      handleError({ message: error.message });
    });
};

const resolveAccount = (path: string) => {
  const parts = path.split("'");

  const type = getAccountType(parts[0].split('/')[1]);
  const number = parseInt(parts[2].split('/')[1]) + 1;

  account.value = {
    path,
    number,
    type,
  };
};

const getAccountType = (type: string) => {
  switch (type) {
    case '44':
      return 'Legacy';

    case '48':
      return 'Legacy multisig';

    case '49':
      return 'Legacy SegWit';

    case '84':
      return 'Native SegWit';
  }

  return 'Unknown';
};

const getNewAddress = () => {
  const path = account.value?.path;
  const lastAddress = addresses.value.at(-1);

  const lastAddressPath =
    lastAddress && lastAddress.path ? lastAddress.path.split('/').at(-1) : null;

  const newAddressNumber = lastAddressPath ? parseInt(lastAddressPath) + 1 : 0;

  const freshPath = `${path}/0/${newAddressNumber}`;

  TrezorConnect.getAddress({
    coin: network.value,
    device: {
      path: device.value?.path,
    },
    keepSession: true,
    path: freshPath,
  })
    .then(({ success, payload }) => {
      if (!success) {
        handleError({ message: payload.error });
        return;
      }

      selectedAddress.value = {
        address: payload.address,
        path: payload.serializedPath,
      };
    })
    .catch((error) => {
      handleError({ message: error.message });
    });
};

const submit = () => {
  if (!selectedAddress.value) {
    return;
  }

  TrezorConnect.signMessage({
    coin: network.value,
    device: {
      path: device.value?.path,
    },
    message: 'I wanna chat!',
    keepSession: true,
    path: selectedAddress.value.path,
  })
    .then(({ success, payload }) => {
      if (!success) {
        handleError({ message: payload.error });
        return;
      }

      const id = `${
        network.value
      }-${faker.internet.domainWord()}-${faker.internet.domainSuffix()}`;
      emit('done', {
        id,
        address: payload.address,
        signature: payload.signature,
        connecting: connecting.value,
        device: device.value,
      });
    })
    .catch((error) => {
      handleError({ message: error.message });
    });
};

onUnmounted(() => {
  TrezorConnect.off(DEVICE_EVENT, onTrezorDeviceEvent);
});
</script>
