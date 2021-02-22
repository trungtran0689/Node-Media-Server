import { EventEmitter } from 'events';
import { BaseServer } from '../base/server';
import { BaseSession } from '../base/session';
import { IServerConfig } from '../base/types';
import { TransServer } from '../trans/server';
import { RtmpServer } from '../rtmp/server';
import { HttpServer } from '../http/server';
import { RelayServer } from '../relay/server';

export class MediaServer {
  public readonly sessions: Map<string, BaseSession>;

  private readonly publishers: Map<string, string>;

  private readonly idlePlayers: Set<string>;

  private readonly nodeEvent: EventEmitter;

  private servers: Set<BaseServer>;

  constructor(private readonly config: IServerConfig) {
    this.sessions = new Map();
    this.publishers = new Map();
    this.idlePlayers = new Set();
    this.nodeEvent = new EventEmitter();
    this.servers = new Set();
  }

  run(): void {
    const modules: any[] = [RtmpServer];

    if (this.config.http) {
      modules.push(HttpServer);
    }

    if (this.config.trans) {
      modules.push(TransServer);
    }

    if (this.config.relay) {
      modules.push(RelayServer);
    }

    modules.forEach((Server) => {
      this.servers.add(
        new Server(
          this.config,
          this.servers,
          this.sessions,
          this.publishers,
          this.idlePlayers,
          this.nodeEvent,
        ),
      );
    });
  }

  on(eventName: string, listener: any): void {
    this.nodeEvent.on(eventName, listener);
  }

  // getSession(id: string): BaseSession {
  //   return this.sessions.get(id);
  // }
}
