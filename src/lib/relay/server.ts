import { BaseServer } from '../base/server';
import { RelayMode } from '../base/types';
import { Logger } from '../core/logger';
import { Utils } from '../core/utils';
import { BaseSession } from '../base/session';

import { RtmpSession } from '../rtmp/session';
import { RelaySession } from './session';

export class RelayServer extends BaseServer {
  private staticSessions: Map<string, RelaySession> = new Map();

  private dynamicSessions: Map<string, RelaySession> = new Map();

  private staticCycle: any;

  public async run(): Promise<void> {
    Logger.log('Node Media Relay Server started');
    this.nodeEvent.on('relayPull', this.onRelayPull.bind(this));
    this.nodeEvent.on('relayPush', this.onRelayPush.bind(this));
    this.nodeEvent.on('prePlay', this.onPrePlay.bind(this));
    this.nodeEvent.on('donePlay', this.onDonePlay.bind(this));
    this.nodeEvent.on('postPublish', this.onPostPublish.bind(this));
    this.nodeEvent.on('donePublish', this.onDonePublish.bind(this));
    this.staticCycle = setInterval(this.onStatic.bind(this), 1000);
  }

  private createSession(
    app: string,
    name: string,
    url: string,
    mode: RelayMode,
    sessionId: string = undefined,
    isDynamic = true,
  ) {
    let inputPath;
    let outputPath;
    const queue = isDynamic ? this.dynamicSessions : this.staticSessions;

    if (sessionId && queue.has(sessionId)) {
      return queue.get(sessionId);
    }

    const rtmpLink = `rtmp://127.0.0.1:${this.config.rtmp.port}/${app}/${name}`;
    if (mode === 'push') {
      inputPath = rtmpLink;
      outputPath = url;
    } else {
      inputPath = url;
      outputPath = rtmpLink;
    }
    const config = {
      app,
      name,
      inputPath,
      outputPath,
    };

    const id = sessionId || Utils.generateNewSessionID();
    const session = new RelaySession(id, config, mode);
    session.on('end', (id) => {
      queue.delete(id);
    });
    queue.set(id, session);
    session.run();
    return session;
  }

  onStatic(): void {
    if (!this.config.relay.tasks) {
      return;
    }

    this.config.relay.tasks.forEach((conf, index) => {
      if (conf.mode === 'static') {
        this.createSession(
          conf.app,
          conf.name || Utils.generateRandomName(),
          conf.edge,
          conf.mode,
          `static_${index}`,
          false,
        );
      }
    });
  }

  onRelayPull(url: string, app: string, name: string): void {
    Logger.log('>>> PULL', app, name, url);
    this.createSession(app, name, url, 'pull');
  }

  onRelayPush(url: string, app: string, name: string): void {
    this.createSession(app, name, url, 'push');
  }

  onPrePlay(id: string, streamPath: string): void {
    if (!this.config.relay.tasks) {
      return;
    }

    const regRes = /\/(.*)\/(.*)/gi.exec(streamPath);
    const [app, stream] = regRes.slice(1);
    this.config.relay.tasks.forEach((conf) => {
      if (app === conf.app && conf.mode === 'pull') {
        const hasApp = conf.edge.match(/rtmp:\/\/([^/]+)\/([^/]+)/);
        const url = hasApp
          ? `${conf.edge}/${stream}`
          : `${conf.edge}${streamPath}`;
        this.createSession(app, stream, url, conf.mode);
      }
    });
  }

  onDonePlay(id: string, streamPath: string, args: any): void {
    const relaySession = this.dynamicSessions.get(id);
    const publisherPath = this.publishers.get(streamPath);
    const session = this.sessions.get(publisherPath);
    if (session instanceof RtmpSession) {
      const playersSize = session.players.size;
      if (relaySession && playersSize === 0) {
        relaySession.stop();
      }
    }
  }

  onPostPublish(id: string, streamPath: string, args: any): void {
    if (!this.config.relay.tasks) {
      return;
    }

    const regRes = /\/(.*)\/(.*)/gi.exec(streamPath);
    const [app, stream] = regRes.slice(1);
    this.config.relay.tasks.forEach((conf) => {
      if (app === conf.app && conf.mode === 'push') {
        const hasApp = conf.edge.match(/rtmp:\/\/([^/]+)\/([^/]+)/);
        const url = hasApp
          ? `${conf.edge}/${stream}`
          : `${conf.edge}${streamPath}`;
        this.createSession(app, stream, url, conf.mode);
      }
    });
  }

  onDonePublish(id: string, streamPath: string, args: any): void {
    const session = this.dynamicSessions.get(id);
    if (session) {
      session.stop();
    }
  }

  stop(): void {
    clearInterval(this.staticCycle);
  }

  getSessions(): Map<string, BaseSession> {
    return this.dynamicSessions;
  }
}
