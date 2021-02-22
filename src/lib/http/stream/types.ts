import { Readable, Writable } from 'stream';

export interface IMediaStream {
  readStream(filePath: string): Readable;
  writeStream(filePath: string): Writable;
  unlink(filePath: string): void;
}
