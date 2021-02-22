import * as path from 'path';
import * as fs from 'fs';
import { Readable, Writable } from 'stream';
import { IMediaStream } from './types';

export class FileStream implements IMediaStream {
  constructor(private root: string) {}

  private getFilePath(filePath: string) {
    return path.join(this.root, filePath.replace('/media', ''));
  }

  readStream(filePath: string): Readable {
    const fullPath = this.getFilePath(filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return fs.createReadStream(fullPath);
  }

  writeStream(filePath: string): Writable {
    const fullPath = this.getFilePath(filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return fs.createWriteStream(fullPath);
  }

  unlink(filePath: string): void {
    const fullPath = this.getFilePath(filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
