//  Created by Mingliang Chen on 17/8/4.
//  illuspas[a]gmail.com
//  Copyright (c) 2017 Nodemedia. All rights reserved.

import * as url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';
import { ParsedUrlQuery } from 'querystring';

import { BufferPool } from './node_core_bufferpool';
import { BaseSession } from './node_media_server';
import { nodeEvent } from './node_core_utils';

export enum ProtocolsEnum {
  HTTP = 'http',
  WS = 'ws',
}

export class NodeFlvSession extends EventEmitter {
  protected readonly bp: BufferPool;
  private isPublisher: boolean;
  public playStreamPath: string;
  protected playArgs: ParsedUrlQuery;
  protected nodeEvent: EventEmitter;
  protected connectCmdObj: any;
  public isStarting: boolean;
  public connectTime: Date;

  constructor(
    public readonly id: string,
    public readonly req: IncomingMessage,
    public readonly res: ServerResponse,
    protected readonly sessions: Map<string, BaseSession>,
    protected readonly publishers: Map<string, string>,
    protected readonly idlePlayers: Set<string>,
    public readonly protocol: ProtocolsEnum,
  ) {
    super();

    this.bp = new BufferPool();
    this.bp.on('error', (e) => {
      // empty
    });
    this.isPublisher = false;
    this.playStreamPath = '';
    this.playArgs = null;
    this.nodeEvent = nodeEvent;

    this.on('connect', this.onConnect);
    this.on('play', this.onPlay);
    this.on('publish', this.onPublish);

    if (this.protocol === ProtocolsEnum.HTTP) {
      this.req.on('data', this.onReqData.bind(this));
      this.req.socket.on('close', this.onReqClose.bind(this));
      this.req.on('error', this.onReqError.bind(this));
    }

    if (this.protocol === ProtocolsEnum.WS) {
      this.res.on('message', this.onReqData.bind(this));
      this.res.on('close', this.onReqClose.bind(this));
      this.res.on('error', this.onReqError.bind(this));
      this.res.write = this.res['send'];
      this.res.end = this.res['close'];
    }
  }

  public run() {
    const method = this.req.method;
    const urlInfo = url.parse(this.req.url, true);
    const streamPath = urlInfo.pathname.split('.')[0];
    const format = urlInfo.pathname.split('.')[1];

    this.connectCmdObj = { method, streamPath, query: urlInfo.query };
    this.nodeEvent.emit('preConnect', this.id, this.connectCmdObj);

    this.isStarting = true;
    this.bp.init(this.handleData());

    this.connectTime = new Date();

    if (format !== 'flv') {
      console.log(`[${this.protocol}] Unsupported format=${format}`);
      this.res.statusCode = 403;
      this.res.end();

      return;
    }

    this.nodeEvent.emit('postConnect', this.id, this.connectCmdObj);

    switch (method) {
      case 'GET': {
        //Play
        this.playStreamPath = streamPath;
        this.playArgs = urlInfo.query;
        console.log(
          `[${this.protocol} play] play stream ` + this.playStreamPath,
        );
        this.emit('play');

        return;
      }
      case 'POST': {
        //Publish
        console.log(`[${this.protocol}] Unsupported method=` + method);
        this.res.statusCode = 405;
        this.res.end();

        return;
      }
      default: {
        console.log(`[${this.protocol}] Unsupported method=` + method);
        this.res.statusCode = 405;
        this.res.end();

        return;
      }
    }
  }

  private onReqData(data) {
    this.bp.push(data);
  }

  private onReqClose() {
    this.stop();
  }

  private onReqError(e) {
    this.stop();
  }

  public stop() {
    if (this.isStarting) {
      this.isStarting = false;
      this.bp.stop();
    }
  }

  public reject() {
    this.stop();
  }

  protected *handleData() {
    console.log(`[${this.protocol} message parser] start`);
    while (this.isStarting) {
      if (this.bp.need(9)) {
        if (yield) {
          break;
        }
      }
    }

    console.log(`[${this.protocol} message parser] done`);
    if (!this.isPublisher) {
      const publisherId = this.publishers.get(this.playStreamPath);

      if (publisherId) {
        this.sessions.get(publisherId).players.delete(this.id);
        this.nodeEvent.emit(
          'donePlay',
          this.id,
          this.playStreamPath,
          this.playArgs,
        );
      }
    }

    this.nodeEvent.emit('doneConnect', this.id, this.connectCmdObj);
    this.res.end();
    this.idlePlayers.delete(this.id);
    this.sessions.delete(this.id);
  }

  private respondUnpublish() {
    this.res.end();
  }

  protected onConnect() {
    // empty
  }

  protected onPlay() {
    this.nodeEvent.emit('prePlay', this.id, this.playStreamPath, this.playArgs);

    if (!this.isStarting) {
      return;
    }

    if (!this.publishers.has(this.playStreamPath)) {
      console.log(
        `[${this.protocol} play] stream not found ` + this.playStreamPath,
      );
      this.idlePlayers.add(this.id);

      return;
    }

    const publisherId = this.publishers.get(this.playStreamPath);
    const publisher = this.sessions.get(publisherId);
    const players = publisher.players;

    players.add(this.id);

    if (this.res.setHeader) {
      this.res.setHeader('Content-Type', 'video/x-flv');
      this.res.setHeader('Access-Control-Allow-Origin', '*');
    }

    //send FLV header
    const FLVHeader = Buffer.from([
      0x46,
      0x4c,
      0x56,
      0x01,
      0x00,
      0x00,
      0x00,
      0x00,
      0x09,
      0x00,
      0x00,
      0x00,
      0x00,
    ]);

    if (publisher.isFirstAudioReceived) {
      FLVHeader[4] |= 0b00000100;
    }

    if (publisher.isFirstVideoReceived) {
      FLVHeader[4] |= 0b00000001;
    }
    this.res.write(FLVHeader);
    if (publisher.metaData) {
      //send Metadata
      const rtmpHeader = {
        chunkStreamID: 5,
        timestamp: 0,
        messageTypeID: 0x12,
        messageStreamID: 1,
      };

      const metaDataFlvMessage = NodeFlvSession.createFlvMessage(
        rtmpHeader,
        publisher.metaData,
      );

      this.res.write(metaDataFlvMessage);
    }
    //send aacSequenceHeader
    if (publisher.audioCodec === 10) {
      const rtmpHeader = {
        chunkStreamID: 4,
        timestamp: 0,
        messageTypeID: 0x08,
        messageStreamID: 1,
      };
      const flvMessage = NodeFlvSession.createFlvMessage(
        rtmpHeader,
        publisher.aacSequenceHeader,
      );

      this.res.write(flvMessage);
    }
    //send avcSequenceHeader
    if (publisher.videoCodec === 7) {
      const rtmpHeader = {
        chunkStreamID: 6,
        timestamp: 0,
        messageTypeID: 0x09,
        messageStreamID: 1,
      };
      const flvMessage = NodeFlvSession.createFlvMessage(
        rtmpHeader,
        publisher.avcSequenceHeader,
      );

      this.res.write(flvMessage);
    }
    //send gop cache
    if (publisher.flvGopCacheQueue) {
      for (const flvMessage of publisher.flvGopCacheQueue) {
        this.res.write(flvMessage);
      }
    }
    console.log(`[${this.protocol} play] join stream ` + this.playStreamPath);
    this.nodeEvent.emit(
      'postPlay',
      this.id,
      this.playStreamPath,
      this.playArgs,
    );
  }

  protected onPublish() {
    // empty
  }

  static createFlvMessage(rtmpHeader, rtmpBody) {
    const FLVTagHeader = Buffer.alloc(11);

    FLVTagHeader[0] = rtmpHeader.messageTypeID;
    FLVTagHeader.writeUIntBE(rtmpBody.length, 1, 3);
    FLVTagHeader[4] = (rtmpHeader.timestamp >> 16) & 0xff;
    FLVTagHeader[5] = (rtmpHeader.timestamp >> 8) & 0xff;
    FLVTagHeader[6] = rtmpHeader.timestamp & 0xff;
    FLVTagHeader[7] = (rtmpHeader.timestamp >> 24) & 0xff;
    FLVTagHeader.writeUIntBE(0, 8, 3);
    const PreviousTagSizeN = Buffer.alloc(4);

    PreviousTagSizeN.writeUInt32BE(11 + rtmpBody.length);

    return Buffer.concat([FLVTagHeader, rtmpBody, PreviousTagSizeN]);
  }
}
