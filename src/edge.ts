import * as dotenv from 'dotenv';
import { Logger, LOG_TYPES, MediaServer } from './lib';

dotenv.config();

const config = {
  rtmp: {
    port: 1989,
    chunkSize: 60000,
    gopCache: true,
    ping: 60,
  },
  http: {
    port: 8989,
    mediaroot: './_media_edge',
    staticroot: './_media_edge',
  },
  relay: {
    tasks: [
      {
        mode: 'push',
        app: 'live',
        edge: 'rtmp://127.0.0.1:1990',
      },
    ],
  },
};

Logger.setLogType(LOG_TYPES.DEBUG);

const nms = new MediaServer(config);

nms.on('preConnect', (id: string, args: any) => {
  Logger.log('preConnect', id, args);

  // const session = nms.getSession(id);
  // session.reject();
});

nms.on('postConnect', (id: string, args: any) => {
  Logger.log('postConnect', id, args);
});

nms.on('doneConnect', (id: string, args: any) => {
  Logger.log('doneConnect', id, args);
});

nms.on('prePublish', (id: string, streamPath: string, args: any) => {
  Logger.log('prePublish', id, streamPath, args);

  // const session = nms.getSession(id);
  // session.reject();
});

nms.on('postPublish', (id: string, streamPath: string, args: any) => {
  Logger.log('postPublish', id, streamPath, args);
});

nms.on('donePublish', (id: string, streamPath: string, args: any) => {
  Logger.log('donePublish', id, streamPath, args);
});

nms.on('prePlay', (id: string, streamPath: string, args: any) => {
  Logger.log('prePlay', id, streamPath, args);

  // const session = nms.getSession(id);
  // session.reject();
});

nms.on('postPlay', (id: string, streamPath: string, args: any) => {
  Logger.log('postPlay', id, streamPath, args);
});

nms.on('donePlay', (id: string, streamPath: string, args: any) => {
  Logger.log('donePlay', id, streamPath, args);
});

nms.run();
