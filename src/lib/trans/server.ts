import * as fs from 'fs';
import { ITransTaskConfig } from '../base/types';

import { BaseServer } from '../base/server';
import { Logger } from '../core/logger';
import { TransSession } from './session';
import { BaseSession } from '../base/session';

export class TransServer extends BaseServer {
  private transSessions: Map<string, TransSession> = new Map();

  public run(): void {
    // try {
    //   fs.mkdirSync(this.config.http?.mediaroot || './_media', {
    //     recursive: true,
    //   });
    //   fs.accessSync(
    //     this.config.http?.mediaroot || './_media',
    //     fs.constants.W_OK,
    //   );
    // } catch (error) {
    //   Logger.error(
    //     `Node Media Trans Server startup failed. MediaRoot:${this.config.http?.mediaroot} cannot be written.`,
    //   );
    //   return;
    // }

    Logger.log('Node Media Trans Server started');

    this.nodeEvent.on('postPublish', this.onPostPublish.bind(this));
    this.nodeEvent.on('donePublish', this.onDonePublish.bind(this));
  }

  // eslint-disable-next-line class-methods-use-this
  private checkRule(
    app: string,
    name: string,
    task: ITransTaskConfig,
  ): boolean {
    if (!task.rule || task.rule === '*') return true;
    const regRes = /\/(.*)\/(.*)/gi.exec(task.rule);
    if (regRes) {
      const [ruleApp, ruleName] = regRes.slice(1);
      if (ruleApp === app) {
        if (ruleName === '*' || ruleName === name) {
          return true;
        }
      }
    }

    return false;
  }

  private onPostPublish(id: string, streamPath: string, args: any) {
    const regRes = /\/(.*)\/(.*)/gi.exec(streamPath);
    const [app, name] = regRes.slice(1);
    this.config.trans.tasks.forEach((task) => {
      const isSupport = this.checkRule(app, name, task);
      if (!isSupport) return;
      const conf = {
        app,
        name,
        args,
        task,
        mediaroot: this.config.http?.mediaroot,
        rtmpPort: this.config.rtmp.port,
      };
      const session = new TransSession(conf);
      this.transSessions.set(id, session);
      session.on('end', () => {
        this.transSessions.delete(id);
      });
      session.run();
    });
  }

  private onDonePublish(id: string, streamPath: string, args: any) {
    const session = this.transSessions.get(id);
    if (session) {
      session.stop();
    }
  }

  getSessions(): Map<string, BaseSession> {
    return this.transSessions;
  }
}
