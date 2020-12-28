import * as _ from 'lodash';

import { NodeMediaServer } from '../../node_media_server';

export function getStreams(req, res, next) {
  const nms: NodeMediaServer = req.nms;

  const stats = [];

  for (const [, session] of nms.sessions) {
    if (!session.isStarting) {
      continue;
    }

    const regRes = /\/(.*)\/(.*)/gi.exec(
      session.publishStreamPath || session.playStreamPath,
    );

    if (regRes === null) {
      continue;
    }

    const [app, channel] = _.slice(regRes, 1);

    let liveApp = _.find(stats, { app });

    if (!liveApp) {
      liveApp = {
        app,
        channels: [],
      };

      stats.push(liveApp);
    }

    let liveChannel = _.find(liveApp.channels, { channel });

    if (!liveChannel) {
      liveChannel = {
        channel,
        publisher: null,
        subscribers: [],
      };

      liveApp.channels.push(liveChannel);
    }

    if (session.isPublishing) {
      liveChannel.publisher = {
        app,
        channel,
        connectId: session.id,
        connectCreated: session.connectTime,
        bytes: session.socket.bytesRead,
        ip: session.socket.remoteAddress,
        audio: {
          audioCodec: session.audioCodec,
          codec: session.audioCodecName,
          profile: session.audioProfileName,
          samplerate: session.audioSamplerate,
          channels: session.audioChannels,
        },
        video: {
          videoCodec: session.videoCodec,
          codec: session.videoCodecName,
          size: session.videoSize,
          fps: session.videoFps,
        },
        userId: session.userId || null,
      };
    }

    if (session.playStreamPath) {
      if (session.constructor.name === 'NodeRtmpSession') {
        liveChannel.subscribers.push({
          app,
          channel,
          connectId: session.id,
          connectCreated: session.connectTime,
          bytes: session.socket.bytesWritten,
          ip: session.socket.remoteAddress,
          protocol: 'rtmp',
          userId: session.userId || null,
        });
      }

      if (session.constructor.name === 'NodeFlvSession') {
        liveChannel.subscribers.push({
          app,
          channel,
          connectId: session.id,
          connectCreated: session.connectTime,
          bytes: session.req.connection.bytesWritten,
          ip: session.req.connection.remoteAddress,
          protocol: session.TAG === 'websocket-flv' ? 'ws' : 'http',
          userId: session.userId || null,
        });
      }
    }
  }

  res.json({
    stats,
  });
}
