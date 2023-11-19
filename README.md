# Peer to peer Trezor chat

Web app which uses [Peer.js](https://github.com/peers/peerjs) for peer to peer chatting via WebRTC and [Trezor connect](https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md) for authentication with Trezor devices.

# DISCLAIMER

This repo and the live demo are only meant for **demonstrational** purpouses of what is possible to do with `@trezor/connect` package.
Neither the code in this repository nor the live demo makes any transactions and
while it should be safe to use, **always be careful**. Never send your crypto unless you are 100% sure why and to whom you are sending it. **And never, under any circumstances, give out your seed to anyone and never record your seed in any digital form.**

## Prerequisites

- installed [Trezor Bridge](https://suite.trezor.io/web/bridge/)
- supported browser (Chrome 84+, Firefox 78+)

## How it works

First, one user needs to set up a chat. This user can choose whether to use BTC Mainnet or Testnet. They then choose a BTC account and an address to sign the message. A random url is then generated that the other user can access.

The other user also chooses a BTC account and an address to sign the message.

After the second signature, the two users are connected through the WebRTC protocol. Immediately after the first connection, both sides exchange a signature and information about which address the message was signed with. Each side then verifies that the signature is valid and they can start chatting.

After the window is closed, chat history could not be restored.

## Live demo

The app is available to try at https://chat.pozdravuje.cz/. The site runs its own implementation of the [PeerJS server](https://github.com/peers/peerjs-server), which only takes care of connecting individual peers.
All communication between the two parties takes place directly via the WebRTC protocol and the server does not have access to it. The server also does not collect or store any user data. While you are connected to a PeerJS server few things are kept in the server's memory as described in [privacy policy](https://github.com/peers/peerjs-server/blob/master/PRIVACY.md) of PeerJS server documentation.

# Development

### Getting started

1. Clone this repository

```
$ git clone git@github.com:mattluk112/trezor-chat
```

2. Install dependencies

```
$ yarn
```

3. Create `.env` file with environment variables

```
PEER_SERVER_HOST=localhost                  # Host fort PeerJS server
PEER_SERVER_PORT=3333                       # Port for PeerJS server
PEER_SERVER_PATH=/peer                      # Path for PeerJS server
URL=http://localhost:5173                   # App Url
VITE_TREZOR_DEBUG=false                     # Use Trezor connect debug
VITE_TREZOR_MANIFEST_EMAIL=info@example.org # Email for Trezor connect manifest
VITE_TREZOR_MANIFEST_URL="${URL}"
VITE_PEER_SERVER_PORT="${PEER_SERVER_PORT}"
VITE_PEER_SERVER_PATH="${PEER_SERVER_PATH}"

```

PeerJS host, port and path [documentation](https://github.com/peers/peerjs-server#config--cli-options)
Trezor connect manifest [documentation](https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md#how-to-use)

### Local development

App is written in `VueJs` and `ReactJs`

Vue version:

```
$ yarn dev
// Starts PeerJS server and Vue.js development server
```

```
$ yarn dev:client:vue
// Start only Vue.js development server
```

React version:

```
$ yarn dev:react
// Starts PeerJS server and React development server
```

```
$ yarn dev:client:react
// Starts only React development server
```

### Build

Vue version:

```
$ yarn build
// Builds server and Vue.js client
```

React version:

```
$ yarn build:react
// Builds server and React client
```
