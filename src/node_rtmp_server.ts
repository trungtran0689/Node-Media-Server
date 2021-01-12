//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2017 Nodemedia. All rights reserved.

import * as net from 'net';

import { generateNewSessionID } from './node_core_utils';
import { BaseSession, INodeMediaServerConfig } from './node_media_server';
import { NodeRtmpSession } from './node_rtmp_session';

export class NodeRtmpServer {
  port: number;
  tcpServer: net.Server;

  constructor(
    config: INodeMediaServerConfig,
    sessions: Map<string, BaseSession>,
    publishers: Map<string, string>,
    idlePlayers: Set<string>,
  ) {
    this.port = config.rtmp.port;

    this.tcpServer = net.createServer((socket) => {
      const id = generateNewSessionID();

      const session = new NodeRtmpSession(
        id,
        config,
        socket,
        sessions,
        publishers,
        idlePlayers,
      );

      sessions.set(id, session as BaseSession);

      session.run();
    });
  }

  run() {
    this.tcpServer.listen(this.port, () => {
      console.log(`Node Media Rtmp Server started on port: ${this.port}`);
    });

    this.tcpServer.on('error', (e) => {
      console.log(`Node Media Rtmp Server ${e}`);
    });
  }
}
