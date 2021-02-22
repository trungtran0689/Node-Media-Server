import { Readable } from 'stream';

export class BufferPool extends Readable {
  readBytes: number;

  poolBytes: number;

  needBytes: number;

  gFun: Generator;

  constructor(options = undefined) {
    super(options);
  }

  init(gFun: Generator): void {
    this.readBytes = 0;
    this.poolBytes = 0;
    this.needBytes = 0;
    this.gFun = gFun;
    this.gFun.next(false);
  }

  stop(): void {
    this.gFun.next(true);
  }

  push(buf: Buffer): any {
    super.push(buf);
    this.poolBytes += buf.length;
    this.readBytes += buf.length;
    if (this.needBytes > 0 && this.needBytes <= this.poolBytes) {
      this.gFun.next(false);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _read(_size: number): void {
    // empty
  }

  read(size?: number): any {
    this.poolBytes -= size;

    return super.read(size);
  }

  need(size: number): any {
    const ret = this.poolBytes < size;

    if (ret) {
      this.needBytes = size;
    }

    return ret;
  }
}
