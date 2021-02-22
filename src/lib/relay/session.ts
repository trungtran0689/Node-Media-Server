import * as ffmpeg from 'fluent-ffmpeg';
import { BaseSession } from '../base/session';
import { RelayMode } from '../base/types';
import { Logger } from '../core/logger';

export interface INodeRelaySessionConfig {
  app: string;
  name: string;
  inputPath: string;
  outputPath: string;
}

export class RelaySession extends BaseSession {
  private ffmpeg;

  constructor(
    public readonly id: string,
    private readonly config: INodeRelaySessionConfig,
    private mode: RelayMode,
  ) {
    super();
  }

  public run(): void {
    const command = ffmpeg(this.config.inputPath);

    if (this.config.inputPath[0] === '/' || this.config.inputPath[1] === ':') {
      command.nativeFramerate();
      command.inputOption('-stream_loop -1');
    }
    command.withAudioCodec('copy');
    command.withVideoCodec('copy');
    command.toFormat('flv');
    command.output(this.config.outputPath);
    command.on('start', (cmd) => {
      Logger.debug(cmd);
    });
    command.on('end', () => {
      this.emit('end', this.id);
    });
    command.on('error', (error, stdout, stderr) => {
      Logger.error(error);
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

  public info(): any {
    return {
      id: this.id,
      app: this.config.app,
      name: this.config.name,
      url: this.config.outputPath,
      mode: this.mode,
    };
  }
}
