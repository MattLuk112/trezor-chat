import { Authors, Identification, Message, Network } from '../../types';
import type { DataConnection, Peer as PeerType, PeerError } from 'peerjs';
import { useEffect, useState } from 'react';
import { Peer } from 'peerjs';
import TrezorConnect, {
  DEVICE,
  DEVICE_EVENT,
  DeviceEvent,
} from '@trezor/connect-web';
import React from 'react';
import ConnectionStatus from './partials/ConnectionStatus';
import DisconnectedModal from './partials/DisconnectedModal';
import Identifications from './partials/Identifications';

type Props = {
  identification: Identification;
  chatId: string;
  network: Network;
  handleError: (error: string) => void;
};

export const Chat: React.FC<Props> = ({
  identification,
  chatId,
  network,
  handleError,
}) => {
  const [guestIdentification, _setGuestIdentification] =
    useState<Identification | null>(null);
  const guestIdentificationRef = React.useRef(guestIdentification);
  const setGuestIdentification = (data: Identification) => {
    guestIdentificationRef.current = data;
    _setGuestIdentification(data);
  };
  const [messages, _setMessages] = useState<Message[]>([]);
  const messagesRef = React.useRef(messages);
  const setMessages = (data: Message[]) => {
    messagesRef.current = data;
    _setMessages(data);
  };
  const [message, setMessage] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [oppositeIsTyping, setOppositeIsTyping] = useState<boolean>(false);
  const [guestVerification, setGuestVerification] = useState<string>('');
  const [trezorConnected, setTrezorConnected] = useState<boolean>(true);
  const [trezorPath, setTrezorPath] = useState<string | undefined>(
    identification.device?.path,
  );

  const [peer, setPeer] = useState<PeerType | null>(null);
  const [remoteConnection, setRemoteConnection] =
    useState<DataConnection | null>(null);

  const onTrezorDeviceEvent = (event: DeviceEvent) => {
    const { type, payload } = event;
    if (type !== DEVICE.CONNECT && type !== DEVICE.DISCONNECT) {
      return;
    }

    if (
      type === DEVICE.CONNECT &&
      payload.id &&
      payload.id === identification.device?.id
    ) {
      setTrezorPath(payload.path);
      setTrezorConnected(true);
    }

    if (
      type === DEVICE.DISCONNECT &&
      payload.path &&
      payload.id === identification.device?.id
    ) {
      setTrezorConnected(false);
    }
  };

  useEffect(() => {
    TrezorConnect.on(DEVICE_EVENT, onTrezorDeviceEvent);

    return () => {
      TrezorConnect.off(DEVICE_EVENT, onTrezorDeviceEvent);
    };
  }, []);

  const startChat = () => {
    setPeer(
      new Peer(identification.id, {
        host: import.meta.env.VITE_PEER_SERVER_HOST,
        port: import.meta.env.VITE_PEER_SERVER_PORT,
        path: import.meta.env.VITE_PEER_SERVER_PATH,
      }),
    );
  };

  useEffect(() => {
    if (peer) {
      peer.on('open', () => {
        registerListeners(identification.connecting ? false : true);
      });
    }
  }, [peer]);

  const sendMessageWithKeyboard = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') {
      return;
    }

    sendMessage();
  };

  const sendMessage = () => {
    if (!message || !remoteConnection) {
      return;
    }

    remoteConnection.send({ type: 'message', value: message });
    handleMessage({
      author: Authors.Me,
      text: message,
    });
    remoteConnection.send({ type: 'action', value: 'endTyping' });
    setMessage('');
  };

  const registerListeners = (isChatStarter: boolean = true) => {
    if (!peer) {
      return;
    }

    peer.on('error', (error: PeerError<any>) => {
      handleError(error.type);
    });

    if (isChatStarter) {
      peer.on('connection', (connection: DataConnection) => {
        setRemoteConnection(connection);
      });
    } else {
      setRemoteConnection(
        peer.connect(chatId, {
          metadata: { ...identification },
        }),
      );
    }
  };

  useEffect(() => {
    if (remoteConnection) {
      onConnectionOpen();
      onConnectionClose();
      onConnectionData();
    }
  }, [remoteConnection]);

  const onConnectionOpen = () => {
    if (!remoteConnection) {
      handleError('PeerJS remote connection not established!');
      return;
    }

    remoteConnection.on('open', () => {
      setConnected(true);
      requestIdentification();
    });
  };

  const onConnectionClose = () => {
    if (!remoteConnection) {
      handleError('PeerJS remote connection not established!');
      return;
    }

    remoteConnection.on('close', () => {
      setConnected(false);
      setOppositeIsTyping(false);
    });
  };

  const onConnectionData = () => {
    if (!remoteConnection) {
      handleError('PeerJS remote connection not established!');
      return;
    }

    remoteConnection.on('data', (data: any) => {
      if (data.type === 'message') {
        handleMessage({
          author: Authors.Opposite,
          text: data.value,
        });
      } else if (data.type === 'action') {
        handleAction(data);
      } else if (data.type === 'identification') {
        setGuestVerification('pending');
        setGuestIdentification(data.value);
      }
    });
  };

  const handleMessage = (data: { author: Authors; text: string }) => {
    setMessages([...messagesRef.current, data]);
  };

  const handleAction = (data: { type: string; value: string }) => {
    if (data.value === 'startTyping') {
      setOppositeIsTyping(true);
    } else if (data.value === 'endTyping') {
      setOppositeIsTyping(false);
    } else if (data.value === 'requestIdentification') {
      sendIdentification();
    }
  };

  const requestIdentification = () => {
    if (!remoteConnection) {
      handleError('PeerJS remote connection not established!');
      return;
    }

    remoteConnection.send({
      type: 'action',
      value: 'requestIdentification',
    });
  };

  const sendIdentification = () => {
    if (!remoteConnection) {
      handleError('PeerJS remote connection not established!');
      return;
    }

    remoteConnection.send({
      type: 'identification',
      value: identification,
    });
  };

  const validateIdentification = (validatingIdentification: Identification) => {
    if (trezorConnected) {
      TrezorConnect.verifyMessage({
        address: validatingIdentification.address,
        coin: network,
        device: {
          path: trezorPath,
        },
        keepSession: false,
        message: 'I wanna chat!',
        signature: validatingIdentification.signature,
      })
        .then(({ success, payload }) => {
          if (!success) {
            handleError(payload.error);
            setGuestVerification('invalid');
            return;
          }

          setGuestVerification('valid');
          TrezorConnect.off(DEVICE_EVENT, onTrezorDeviceEvent);
        })
        .catch((error) => {
          handleError(error.message);
        });
    }
  };

  useEffect(() => {
    if (
      guestIdentification &&
      guestVerification === 'pending' &&
      trezorConnected
    ) {
      validateIdentification(guestIdentification);
    }
  }, [guestIdentification, guestVerification, trezorConnected]);

  useEffect(() => {
    if (!remoteConnection) {
      return;
    }

    if (message) {
      remoteConnection.send({ type: 'action', value: 'startTyping' });
    }

    const typingDelay = setTimeout(() => {
      remoteConnection.send({ type: 'action', value: 'endTyping' });
    }, 800);
    return () => clearTimeout(typingDelay);
  }, [message, 800]);

  useEffect(() => {
    const handleUnload = () => {
      if (remoteConnection) {
        remoteConnection.close();
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [remoteConnection]);

  useEffect(() => {
    startChat();
  }, []);

  return (
    <>
      <div className="relative flex flex-col w-full max-w-xl border border-gray-200 rounded-lg shadow-lg h-4/5">
        <ConnectionStatus connected={connected} />
        <Identifications
          connected={connected}
          guestIdentification={guestIdentification}
          guestVerification={guestVerification}
          identification={identification}
        />
        {/* Chat window */}
        <div className="flex flex-col-reverse flex-grow px-2 overflow-y-auto text-xs no-scrollbar">
          {/* Typing animation */}
          {oppositeIsTyping && (
            <div className="my-1">
              <div className="inline-flex items-center p-2 space-x-1.5 bg-gray-100 rounded-md">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          {/* Messages */}
          {messages
            .slice()
            .reverse()
            .map((message, index) => (
              <div
                key={index}
                className={`flex my-1 ${
                  message.author === Authors.Me ? 'justify-end' : ''
                }`}
              >
                <div
                  className={`p-2 rounded-md ${
                    message.author === Authors.Opposite
                      ? 'bg-gray-100'
                      : 'bg-emerald-500'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
        </div>
        {/* Input and send button for new message */}
        <div className="flex items-center p-2 space-x-4">
          <input
            type="text"
            value={message}
            className="block w-full p-2 text-xs text-gray-900 border-0 rounded-md shadow-sm outline-none ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            onChange={(event) => setMessage(event.target.value)}
            onKeyUp={sendMessageWithKeyboard}
          />
          <button
            type="button"
            className={`${
              message
                ? 'text-gray-300 hover:text-emerald-500 cursor-pointer'
                : 'text-gray-100 cursor-not-allowed'
            }`}
            onClick={sendMessage}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
      <DisconnectedModal trezorConnected={trezorConnected} />
    </>
  );
};

export default Chat;
