import * as fs from 'fs';
import { PeerServer } from 'peer';
import 'dotenv/config';

interface Options {
  port: number;
  path: string | undefined;
  expire_timeout: number;
  ssl?: undefined | { key: string; cert: string };
}

const options: Options = {
  port: Number(String(process.env.PEER_SERVER_PORT)) | 3000,
  path: process.env.PEER_SERVER_PATH,
  expire_timeout: 600000,
};

if (process.env.PEER_SERVER_ENABLE_SSL) {
  options.ssl = {
    // @ts-ignore
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    // @ts-ignore
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
}

PeerServer(options, () => {
  console.log(`Server is running on port ${process.env.PEER_SERVER_PORT}`);
});
