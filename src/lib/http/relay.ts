import * as express from 'express';
import { EventEmitter } from 'events';
import { IHttpConfig } from '../base/types';
import { BaseServer } from '../base/server';
import { RelayServer } from '../relay/server';

export class HttpRelay {
  public readonly router = express.Router();

  constructor(
    private readonly config: IHttpConfig,
    private readonly servers: Set<BaseServer>,
    private readonly nodeEvent: EventEmitter,
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get('/relays', this.getRelays.bind(this));
    this.router.post('/relays/pull', this.pullStream.bind(this));
    this.router.post('/relays/push', this.pushStream.bind(this));
  }

  private getRelays(req: express.Request, res: express.Response) {
    let relayServer: RelayServer;
    this.servers.forEach((server) => {
      if (server instanceof RelayServer) {
        relayServer = server;
      }
    });
    const stats = {};
    relayServer.getSessions().forEach((session) => {
      const info = session.info();

      if (!stats[info.app]) {
        stats[info.app] = {};
      }

      if (!stats[info.app][info.name]) {
        stats[info.app][info.name] = {
          relays: [],
        };
      }

      stats[info.app][info.name].relays.push(info);
    });
    res.json(stats);
  }

  private pullStream(req: express.Request, res: express.Response) {
    const url = req.body.url;
    const app = req.body.app;
    const name = req.body.name;
    console.log(url, app, name);
    if (url && app && name) {
      this.nodeEvent.emit('relayPull', url, app, name);
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  }

  private pushStream(req: express.Request, res: express.Response) {
    const url = req.body.url;
    const app = req.body.app;
    const name = req.body.name;
    if (url && app && name) {
      this.nodeEvent.emit('relayPush', url, app, name);
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  }
}
