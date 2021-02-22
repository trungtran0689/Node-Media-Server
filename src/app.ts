import * as dotenv from 'dotenv';
import { Logger, LOG_TYPES, MediaServer } from './lib';

dotenv.config();

const config = {
  rtmp: {
    port: 1935,
    chunkSize: 60000,
    gopCache: true,
    ping: 60,
  },
  http: {
    port: 8000,
    mediaroot: 'gs://test-transcode',
    staticroot: './_media',
  },
  // api: {
  //   token: null,
  // },
  relay: {
    // tasks: [
    //   {
    //     mode: 'static',
    //     app: 'live',
    //     name: 'test',
    //     edge: '/Users/TRUNGTRAN/Desktop/1920x1080_2600000.mp4',
    //   },
    // ],
  },
  trans: {
    tasks: [
      {
        rule: '*',
        models: [
          {
            audioBitrate: '96k',
            videoBitrate: '3500k',
            videoFps: 25,
            videoWidth: 1920,
            videoHeight: 1080,
          },
          {
            audioBitrate: '96k',
            videoBitrate: '2600k',
            videoFps: 25,
            videoWidth: 1280,
            videoHeight: 720,
          },
        ],
        hls: true,
        hlsTime: 2,
        hlsListSize: 4,
        prefix: 'http://127.0.0.1:8000/media',
      },
    ],
  },
  // auth: {
  //   publish: true,
  //   play: true,
  //   secret: 'test',
  // },
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
