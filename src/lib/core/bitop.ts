/* eslint-disable no-param-reassign */
export default class Bitop {
  buffer: Buffer;

  buflen: number;

  bufpos: number;

  bufoff: number;

  iserro: boolean;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.buflen = buffer.length;
    this.bufpos = 0;
    this.bufoff = 0;
    this.iserro = false;
  }

  read(n: number): number {
    let v = 0;
    let d = 0;
    while (n) {
      if (n < 0 || this.bufpos >= this.buflen) {
        this.iserro = true;
        return 0;
      }

      this.iserro = false;
      d = this.bufoff + n > 8 ? 8 - this.bufoff : n;

      v <<= d;
      v +=
        (this.buffer[this.bufpos] >> (8 - this.bufoff - d)) & (0xff >> (8 - d));

      this.bufoff += d;
      n -= d;

      if (this.bufoff === 8) {
        this.bufpos++;
        this.bufoff = 0;
      }
    }
    return v;
  }

  look(n: number): number {
    const p = this.bufpos;
    const o = this.bufoff;
    const v = this.read(n);
    this.bufpos = p;
    this.bufoff = o;
    return v;
  }

  read_golomb(): number {
    let n;
    for (n = 0; this.read(1) === 0 && !this.iserro; n++);
    return (1 << n) + this.read(n) - 1;
  }
}
