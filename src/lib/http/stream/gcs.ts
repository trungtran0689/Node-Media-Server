import { Readable, Writable } from 'stream';
import { Bucket, Storage } from '@google-cloud/storage';
import { IMediaStream } from './types';

export class GCSStream implements IMediaStream {
  private bucket: Bucket;

  constructor(private root: string) {
    const storage = new Storage();
    const bucketName = root.replace('gs://', '');
    this.bucket = storage.bucket(bucketName);
  }

  // eslint-disable-next-line class-methods-use-this
  private getFilePath(filePath: string) {
    return filePath.replace(/^\/|\/$/g, '');
  }

  readStream(filePath: string): Readable {
    const file = this.bucket.file(this.getFilePath(filePath));
    return file.createReadStream();
  }

  writeStream(filePath: string): Writable {
    const file = this.bucket.file(this.getFilePath(filePath));
    const cacheControl = filePath.match(/(\.m3u8|\.mpd)$/)
      ? 'no-cache'
      : 'public, max-age=3600';
    const metadata = {
      cacheControl,
    };
    return file.createWriteStream({
      metadata,
    });
  }

  unlink(filePath: string): void {
    // this.bucket
    //   .file(this.getFilePath(filePath))
    //   .delete()
    //   .catch((err) => {
    //     Logger.error(err);
    //   });
  }
}
