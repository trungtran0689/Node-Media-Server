export enum SessionStatusEnum {
  CONNECTED = 'connected',
  PUBLISHING = 'publishing',
  SUBSCRIBED = 'subscribed',
  DISCONNECTED = 'disconnected',
}

export enum SessionTypeEnum {
  CONNECTED = 'connected',
  ACCEPTED = 'accepted',
  PUBLISHER = 'publisher',
  SUBSCRIBER = 'subscriber',
}
export interface IAuthConfig {
  publish?: boolean;
  play?: boolean;
  secret?: string;
}

export interface IRtmpConfig {
  port: number;
  chunkSize: number;
  gopCache: boolean;
  ping?: number;
  pingTimeout?: number;
  auth?: IAuthConfig;
}

export interface IHttpConfig {
  port: number | string;
  mediaroot?: string;
  staticroot?: string;
  allowOrigin?: string;
}

export interface IApiConfig {
  token: string;
}

export interface IFissionConfig {
  ffmpeg: string;
}

export type RelayMode = string;

interface IRelayTaskConfig {
  app?: string;
  name?: string;
  mode: RelayMode;
  edge: string;
}

export interface IRelayConfig {
  tasks?: IRelayTaskConfig[];
}

interface ITransTaskModelConfig {
  // audio bitrate
  audioBitrate: string;
  // video bitrate
  videoBitrate: string;
  // video resolution
  videoWidth: number;
  videoHeight: number;
  // video fps
  videoFps: number;
}

export interface ITransTaskConfig {
  rule: string;
  models: ITransTaskModelConfig[];
  hls?: boolean;
  dash?: boolean;
  dashFlags?: string;
  hlsTime?: number;
  hlsListSize?: number;
  prefix?: string;
  mp4?: boolean;
  mp4Flags?: string;
}
export interface ITransConfig {
  tasks: ITransTaskConfig[];
}

export interface IServerConfig {
  rtmp: IRtmpConfig;
  http?: IHttpConfig;
  api?: IApiConfig;
  relay?: IRelayConfig;
  trans?: ITransConfig;
  auth?: IAuthConfig;
}
