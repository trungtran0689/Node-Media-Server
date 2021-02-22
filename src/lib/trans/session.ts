import * as ffmpeg from 'fluent-ffmpeg';
import { BaseSession } from '../base/session';
import { ITransTaskConfig } from '../base/types';
import { Logger } from '../core/logger';

interface INodeTransSessionConfig {
  app: string;
  name: string;
  args: any[];
  rtmpPort: number;
  mediaroot: string;
  task: ITransTaskConfig;
}

export class TransSession extends BaseSession {
  private ffmpeg;

  constructor(private readonly config: INodeTransSessionConfig) {
    super();
  }

  private buildHLS(command: ffmpeg.FfmpegCommand): void {
    if (!this.config.task.hls) {
      return;
    }

    const vInputStreams: string[] = [];
    const vOutputStreams: string[] = [];
    const aStreams: number[] = [];
    const vFilters: any[] = [];
    const vOutputOptions: string[] = [];
    const aOutputOptions: string[] = [];
    const streamMaps: string[] = [];
    this.config.task.models.forEach((model, index) => {
      vInputStreams.push(`v${index}`);
      vOutputStreams.push(`v${index}out`);
      aStreams.push(index);

      // Video complex filters
      vFilters.push({
        filter: 'scale',
        inputs: [`v${index}`],
        options: { w: model.videoWidth, h: model.videoHeight },
        outputs: [`v${index}out`],
      });

      // Video output options
      vOutputOptions.push(`-map [v${index}out]`);
      vOutputOptions.push(`-c:v:${index} libx264`);
      vOutputOptions.push(`-b:v:${index} ${model.videoBitrate}`);
      vOutputOptions.push('-preset veryfast');
      vOutputOptions.push(`-g ${model.videoFps}`);
      vOutputOptions.push('-sc_threshold 0');

      // Audio output options
      aOutputOptions.push(`-map a:0`);
      aOutputOptions.push(`-c:a:${index} aac`);
      aOutputOptions.push(`-b:a:${index} ${model.audioBitrate}`);

      // Stream mapping
      streamMaps.push(`v:${index},a:${index},name:${model.videoHeight}p`);
    });
    vFilters.unshift({
      filter: 'split',
      inputs: ['0:v'],
      options: vInputStreams.length,
      outputs: vInputStreams,
    });

    // ffmpeg command
    command.complexFilter(vFilters);
    command.outputOptions(vOutputOptions);
    command.outputOptions(aOutputOptions);

    const outPath = `${
      this.config.task.prefix ? this.config.task.prefix : this.config.mediaroot
    }/${this.config.app}/${this.config.name}`;
    // https://dmnet.cc/index.php/archives/10/
    command.outputOptions([
      '-force_key_frames expr:gte(t,n_forced*2)',
      // '-strftime 1',
      '-f hls',
      '-master_pl_name master.m3u8',
      `-hls_time ${this.config.task.hlsTime || 4}`,
      `-hls_list_size ${this.config.task.hlsListSize || 4}`,
      '-hls_flags append_list+delete_segments+omit_endlist+discont_start',
      '-method PUT',
      '-http_persistent 0',
      `-hls_segment_filename ${outPath}/%v/seg-%5d.ts`,
    ]);
    command.outputOption('-var_stream_map', `${streamMaps.join(' ')}`);

    command.output(`${outPath}/%v/index.m3u8`);
  }

  private buildMp4(command: ffmpeg.FfmpegCommand): void {
    if (!this.config.task.mp4) {
    }
  }

  public run(): void {
    // Ref: https://www.martin-riedl.de/2020/04/17/using-ffmpeg-as-a-hls-streaming-server-overview/
    const inputPath = `rtmp://127.0.0.1:${this.config.rtmpPort}/${this.config.app}/${this.config.name}`;
    const command = ffmpeg(inputPath);

    this.buildHLS(command);

    this.buildMp4(command);

    command.on('start', (cmd) => {
      Logger.debug(cmd);
    });
    command.on('error', (error, stdout, stderr) => {
      Logger.error(error);
      Logger.error(stderr);
    });
    command.on('data', (data) => {
      Logger.debug(data);
    });

    command.run();

    this.ffmpeg = command;
  }

  public stop(): void {
    this.ffmpeg.kill('SIGSTOP');
  }

  public reject(): void {
    this.stop();
  }
}
