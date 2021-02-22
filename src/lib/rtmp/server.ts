import * as net from 'net';
import { BaseServer } from '../base/server';
import { Logger } from '../core/logger';

import { BaseSession } from '../base/session';
import { RtmpSession } from './session';
import { Utils } from '../core/utils';

const RTMP_PORT = 1935;
const RTMPS_PORT = 443;

export class RtmpServer extends BaseServer {
  private tcpServer: net.Server;

  run(): void {
    this.tcpServer = net.createServer((socket: net.Socket) => {
      const id = Utils.generateNewSessionID();
      const session = new RtmpSession(
        id,
        this.config.rtmp,
        socket,
        this.sessions,
        this.publishers,
        this.idlePlayers,
        this.nodeEvent,
      );

      this.sessions.set(id, session);

      session.run();
    });
    this.tcpServer.listen(this.config.rtmp.port || RTMP_PORT, () => {
      Logger.log(
        `Node Media Rtmp Server started on port: ${this.config.rtmp.port}`,
      );
    });
    this.tcpServer.on('error', (e) => {
      Logger.log(`Node Media Rtmp Server ${e}`);
    });
  }

  getSessions(): Map<string, BaseSession> {
    return this.sessions;
  }
}
