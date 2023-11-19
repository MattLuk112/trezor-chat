import { Account, Address, Device, Identification, Network } from '../../types';
import { useEffect, useState } from 'react';
import { faker } from '@faker-js/faker';
import TrezorConnect, {
  DEVICE,
  DEVICE_EVENT,
  DeviceEvent,
} from '@trezor/connect-web';
import React from 'react';
import SelectButton from './partials/SelectButton';

type Props = {
  network: Network;
  connecting: boolean;
  done: (payload: Identification) => void;
  handleError: (error: string) => void;
};

export const Authenticate: React.FC<Props> = ({
  network,
  connecting,
  done,
  handleError,
}) => {
  const [devices, _setDevices] = useState<Device[]>([]);
  const devicesRef = React.useRef(devices);
  const setDevices = (data: Device[]) => {
    devicesRef.current = data;
    _setDevices(data);
  };
  const [device, setDevice] = useState<Device | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const onTrezorDeviceEvent = (event: DeviceEvent) => {
    const { type, payload } = event;
    if (type === DEVICE.CONNECT) {
      setDevices([
        ...devicesRef.current,
        {
          id: payload.id,
          label: payload.label,
          name: payload.name,
          path: payload.path,
        },
      ]);
      if (!device) {
        setDevice({
          id: payload.id,
          label: payload.label,
          name: payload.name,
          path: payload.path,
        });
      }
    } else if (type === DEVICE.DISCONNECT) {
      setDevices([
        ...devicesRef.current.filter((single) => single.id !== payload.id),
      ]);
      setDevice(null);
      setAddresses([]);
      setAccount(null);
      setSelectedAddress(null);
    }
  };

  useEffect(() => {
    TrezorConnect.on(DEVICE_EVENT, onTrezorDeviceEvent);

    return () => {
      TrezorConnect.off(DEVICE_EVENT, onTrezorDeviceEvent);
    };
  }, []);

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

  const resolveAccount = (path: string) => {
    const parts = path.split("'");

    const type = getAccountType(parts[0].split('/')[1]);
    const number = parseInt(parts[2].split('/')[1]) + 1;

    setAccount({
      path,
      number,
      type,
    });
  };

  const selectAccount = (trezor: Device | null) => {
    TrezorConnect.getAccountInfo({
      coin: network,
      device: {
        path: trezor?.path,
      },
      details: 'tokens',
      keepSession: true,
      tokens: 'used',
    })
      .then(({ success, payload }) => {
        if (!success) {
          handleError(payload.error);
          return;
        }

        if (payload.path) {
          resolveAccount(payload.path);
        }
      })
      .catch((error) => {
        handleError(error.message);
      });
  };

  const getNewAddress = () => {
    const path = account?.path;
    const lastAddress = addresses.at(-1);

    const lastAddressPath =
      lastAddress && lastAddress.path
        ? lastAddress.path.split('/').at(-1)
        : null;

    const newAddressNumber = lastAddressPath
      ? parseInt(lastAddressPath) + 1
      : 0;

    const freshPath = `${path}/0/${newAddressNumber}`;

    TrezorConnect.getAddress({
      coin: network,
      device: {
        path: device?.path,
      },
      keepSession: true,
      path: freshPath,
    })
      .then(({ success, payload }) => {
        if (!success) {
          handleError(payload.error);
          return;
        }

        setSelectedAddress({
          address: payload.address,
          path: payload.serializedPath,
        });
      })
      .catch((error) => {
        handleError(error.message);
      });
  };

  const submit = () => {
    if (!selectedAddress) {
      return;
    }

    TrezorConnect.signMessage({
      coin: network,
      device: {
        path: device?.path,
      },
      keepSession: true,
      message: 'I wanna chat!',
      path: selectedAddress.path,
    })
      .then(({ success, payload }) => {
        if (!success) {
          handleError(payload.error);
          return;
        }

        const id = `${network}-${faker.internet.domainWord()}-${faker.internet.domainSuffix()}`;
        done({
          id,
          address: payload.address,
          signature: payload.signature,
          connecting: connecting,
          device,
        });
      })
      .catch((error) => {
        handleError(error.message);
      });
  };

  return (
    <>
      <div className="w-full max-w-xl p-4 bg-white rounded-md shadow-lg">
        {devices.length === 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <p>Please connect your Trezor and</p>
            <SelectButton onPress={() => selectAccount(null)}>
              Select account
            </SelectButton>
          </div>
        )}
        {devices.length > 0 && (
          <div className="flex flex-col space-y-4">
            <div>
              <p className="pb-1">
                To {connecting ? 'connect to chat' : 'start a chat'} please
                select account and address
              </p>
              {devices.map((trezor, index) => (
                <div
                  key={index}
                  className={`flex items-center py-4 space-x-4 cursor-pointer ${
                    device && device.path === trezor.path
                      ? 'border border-emerald-500 rounded-md bg-emerald-50'
                      : ''
                  }`}
                >
                  <div className="p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col flex-grow">
                    <div>{trezor.name}</div>
                    <div className="text-xs font-bold">{trezor.label}</div>
                  </div>
                  <div className="flex items-center pr-2 text-sm font-bold cursor-pointer justify-self-end text-emerald-500 hover:text-emerald-800">
                    {(account === null ||
                      (device && device.path !== trezor.path)) && (
                      <SelectButton onPress={() => selectAccount(trezor)}>
                        Select account
                      </SelectButton>
                    )}
                    {account && device && device.path === trezor.path && (
                      <SelectButton
                        icon={false}
                        onPress={() => selectAccount(trezor)}
                      >
                        {account.type} account #{account.number}
                      </SelectButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {account && (
              <div>
                <p className="pb-1 text-sm font-bold">Used addresses</p>
                <div className="overflow-y-auto text-sm divide-y divide-gray-100 shadow-inner max-h-28">
                  {addresses
                    .slice()
                    .reverse()
                    .map((address, index) => (
                      <div
                        key={index}
                        className={`p-2 space-x-4 cursor-pointer ${
                          selectedAddress &&
                          selectedAddress.address === address.address
                            ? 'bg-emerald-50'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <span className="text-gray-300">
                          /{address.path.split('/').at(-1)}
                        </span>
                        <span>{address.address}</span>
                      </div>
                    ))}
                  {addresses.length === 0 && (
                    <p className="p-2 text-xs font-bold text-center">
                      No used addresses
                    </p>
                  )}
                </div>
              </div>
            )}
            {account && (
              <div>
                <button
                  type="button"
                  className="flex items-center text-sm font-bold text-emerald-500 hover:text-emerald-800"
                  onClick={getNewAddress}
                >
                  Use fresh address
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            )}
            {selectedAddress && (
              <div className="flex items-center justify-center">
                <button
                  className="px-4 py-2 border rounded-md border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-emerald-100"
                  type="button"
                  onClick={submit}
                >
                  {connecting ? 'Connect to chat' : 'Start chat'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Authenticate;
