import { EventEmitter } from 'events';
import { BaseSession } from './session';
import { IServerConfig } from './types';

export abstract class BaseServer {
  constructor(
    protected readonly config: IServerConfig,
    protected readonly servers: Set<BaseServer>,
    protected readonly sessions: Map<string, BaseSession>,
    protected readonly publishers: Map<string, string>,
    protected readonly idlePlayers: Set<string>,
    protected readonly nodeEvent: EventEmitter,
  ) {
    this.run();
  }

  abstract run(): void;

  getSessions(...args: any): Map<string, BaseSession> {
    return this.sessions;
  }
}
