import { v4 } from 'uuid';
import * as Crypto from 'crypto';

function generateNewSessionID(): string {
  return v4();
}

function generateRandomName(length = 6): string {
  let name = '';
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const numPossible = possible.length;
  for (let i = 0; i < length; i++) {
    name += possible.charAt((Math.random() * numPossible) | 0);
  }

  return name;
}

function verifyAuth(
  signStr: string | string[],
  streamId: string,
  secretKey: string,
): boolean {
  if (signStr === undefined) {
    return false;
  }
  let sign;
  if (typeof signStr !== 'string') {
    sign = signStr[0];
  } else {
    sign = signStr;
  }
  // const now = (Date.now() / 1000) | 0;
  // const exp = parseInt(sign.split('-')[0], 10);
  // if (exp < now) {
  //   return false;
  // }
  // const shv = sign.split('-')[1];
  // const str = `${streamId}-${exp}-${secretKey}`;
  const shv = sign;
  const str = `${streamId}-${secretKey}`;

  const md5 = Crypto.createHash('md5');
  const ohv = md5.update(str).digest('hex');
  return shv === ohv;
}

export const Utils = {
  generateRandomName,
  generateNewSessionID,
  verifyAuth,
};
