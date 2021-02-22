import * as express from 'express';

import * as createHttpError from 'http-errors';
import { IHttpConfig } from '../base/types';
import { FileStream } from './stream/file';
import { GCSStream } from './stream/gcs';
import { IMediaStream } from './stream/types';

export class HttpMedia {
  public readonly path = /^\/media\/.+$/;

  public readonly router = express.Router();

  constructor(
    private readonly config: IHttpConfig,
    private readonly mediaStream: IMediaStream = config.mediaroot.startsWith(
      'gs://',
    )
      ? new GCSStream(config.mediaroot)
      : new FileStream(config.mediaroot),
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(this.path, this.getMedia.bind(this));
    this.router.put(this.path, this.putMedia.bind(this));
    this.router.delete(this.path, this.deleteMedia.bind(this));
  }

  private getMedia(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    this.mediaStream
      .readStream(req.path)
      .on('error', () => {
        next(createHttpError(404));
      })
      .pipe(res, { end: true });
  }

  private putMedia(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    req
      .pipe(
        this.mediaStream.writeStream(req.path).on('error', () => {
          next(createHttpError(404));
        }),
        { end: true },
      )
      .on('end', next);
  }

  private deleteMedia(req: express.Request, res: express.Response) {
    this.mediaStream.unlink(req.path);
    res.sendStatus(204);
  }
}
