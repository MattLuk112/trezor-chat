import { Identification, Network } from './../types';
import { useEffect, useState } from 'react';
import TrezorConnect from '@trezor/connect-web';
import Authenticate from './components/Authenticate';
import Chat from './components/Chat';
import ErrorAlert from './components/partials/ErrorAlert';
import NetworkSelect from './components/NetworkSelect';

export const Index: React.FC = () => {
  const [trezorConnectInitialized, setTrezorConnectInitialized] =
    useState<boolean>(false);

  const [network, setNetwork] = useState<Network | null>(null);
  const [identification, setIdentification] = useState<Identification | null>(
    null,
  );

  const [chatPrepared, setChatPrepared] = useState<boolean>(false);
  const [chatId] = useState<string>(
    new URLSearchParams(window.location.search).get('c') ?? '',
  );
  const [isConnecting] = useState<boolean>(chatId ? true : false);

  const [currentError, setCurrentError] = useState<string>('');

  useEffect(() => {
    TrezorConnect.init({
      debug: import.meta.env.TREZOR_DEBUG ?? false,
      manifest: {
        email: import.meta.env.VITE_TREZOR_MANIFEST_EMAIL,
        appUrl: import.meta.env.VITE_TREZOR_MANIFEST_URL,
      },
    })
      .then(() => {
        setTrezorConnectInitialized(true);
      })
      .catch((error) => {
        handleError(error.message);
      });
  }, []);

  useEffect(() => {
    const deleteDelay = setTimeout(() => {
      setCurrentError('');
    }, 5000);

    return () => clearTimeout(deleteDelay);
  }, [currentError]);

  if (isConnecting && !network) {
    setNetwork(
      chatId.split('-')[0] === Network.Mainnet
        ? Network.Mainnet
        : Network.Testnet,
    );
  }

  const selectNetwork = (networkName: Network) => {
    setNetwork(networkName);
  };

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

    setIdentification(payload);
    setChatPrepared(true);
  };

  const handleError = (error: string) => {
    setCurrentError(error);
  };

  return (
    <>
      <div className="flex flex-col w-screen h-screen p-12">
        <h1 className="text-4xl text-center text-gray-900">
          Peer 2 peer Trezor chat
        </h1>
        <div className="flex items-center justify-center flex-grow">
          {!trezorConnectInitialized && (
            <p className="text-sm font-bold text-gray-500">
              Initializing Trezor connect
            </p>
          )}
          {trezorConnectInitialized && (
            <>
              {!chatPrepared && !isConnecting && !network && (
                <NetworkSelect selectNetwork={selectNetwork} />
              )}
              {!chatPrepared && network && (
                <Authenticate
                  network={network}
                  connecting={isConnecting}
                  done={authenticated}
                  handleError={handleError}
                />
              )}
              {chatPrepared && identification && network && (
                <Chat
                  identification={identification}
                  chatId={chatId}
                  network={network}
                  handleError={handleError}
                />
              )}
            </>
          )}
        </div>
      </div>
      {currentError && <ErrorAlert currentError={currentError} />}
    </>
  );
};

export default Index;
