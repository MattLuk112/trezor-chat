type Account = {
  path: string;
  number: number;
  type: string;
};

type Address = {
  address: string;
  path: string;
};

enum Authors {
  Me = 'me',
  Opposite = 'opposite',
}

type Device = {
  id: string | null | undefined;
  label: string;
  name: string;
  path: string;
};

type Identification = {
  id: string;
  address: string;
  signature: string;
  connecting: boolean;
  device?: Device | null;
};

type Message = {
  author: Authors;
  text: string;
};

enum Network {
  Testnet = 'TEST',
  Mainnet = 'BTC',
}

export { Account, Address, Authors, Device, Identification, Message, Network };
