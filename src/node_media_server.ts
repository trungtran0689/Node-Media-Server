//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2017 Nodemedia. All rights reserved.

import { EventEmitter } from 'events';

import { nodeEvent } from './node_core_utils';
import { NodeHttpServer } from './node_http_server';
import { NodeRtmpServer } from './node_rtmp_server';
import { NodeRtmpSession } from './node_rtmp_session';
import { NodeFlvSession } from './node_flv_session';

export interface INodeMediaServerConfig {
  rtmp: {
    port: number;
    chunk_size: number;
    gop_cache: boolean;
    ping: number;
    ping_timeout: number;
  };
  http: {
    port: number | string;
  };
  api: {
    token: string;
  };
}

export type BaseSession = { userId?: string } & NodeRtmpSession &
  NodeFlvSession;

export class NodeMediaServer {
  config: INodeMediaServerConfig;

  sessions: Map<string, BaseSession>;
  publishers: Map<string, string>;
  idlePlayers: Set<string>;
  nodeEvent: EventEmitter;

  nrs: NodeRtmpServer;
  nhs: NodeHttpServer;

  constructor(config: INodeMediaServerConfig) {
    this.config = config;

    this.sessions = new Map();
    this.publishers = new Map();
    this.idlePlayers = new Set();
    this.nodeEvent = nodeEvent;
  }

  run() {
    if (this.config.rtmp) {
      this.nrs = new NodeRtmpServer(
        this.config,
        this.sessions,
        this.publishers,
        this.idlePlayers,
      );

      this.nrs.run();
    }

    if (this.config.http) {
      this.nhs = new NodeHttpServer(
        this.config,
        this.sessions,
        this.publishers,
        this.idlePlayers,
      );

      this.nhs.run();
    }
  }

  on(eventName, listener) {
    this.nodeEvent.on(eventName, listener);
  }

  getSession(id: string) {
    return this.sessions.get(id);
  }
}
