import { EventEmitter } from 'events';

export abstract class BaseSession extends EventEmitter {
  abstract run(): void;

  abstract stop(): void;

  abstract reject(): void;

  info(): any {
    return {
      class: this.constructor.name,
    };
  }
}
