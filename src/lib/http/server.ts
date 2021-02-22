import * as http from 'http';
import * as express from 'express';
import { Request, Response, Application, NextFunction } from 'express';

import { HttpError } from 'http-errors';
import { BaseServer } from '../base/server';
import { HttpMedia } from './media';
import { Logger } from '../core/logger';
import { HttpRelay } from './relay';

export class HttpServer extends BaseServer {
  public app: Application;

  private httpServer: http.Server;

  run(): void {
    this.app = express();

    this.app.all('*', (req: Request, res: Response, next: NextFunction) => {
      res.header(
        'Access-Control-Allow-Origin',
        this.config.http.allowOrigin || '*',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type,Content-Length, Authorization, Accept,X-Requested-With',
      );
      res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    // this.app.use(fileUpload());
    this.app.get('/', (req, res) => res.send('Express + TypeScript Server'));
    this.app.use(express.static(this.config.http?.staticroot));
    this.app.use(
      express.urlencoded({
        extended: true,
      }),
    );
    this.app.use(express.json());

    // Init controllers
    const controllers = [
      new HttpMedia(this.config.http),
      new HttpRelay(this.config.http, this.servers, this.nodeEvent),
    ];
    controllers.forEach((controller) => {
      this.app.use(controller.router);
    });

    // Handle error
    this.app.use((error: HttpError, req, res, next) => {
      // Sets HTTP status code
      res.status(error.status || 500);
      // Sends response
      res.json({ message: error.message });
    });
    this.httpServer = http.createServer(this.app);

    const port = this.config.http.port;
    this.httpServer.listen(port, () => {
      Logger.log(`Node Media Http Server started on port: ${port}`);
    });

    this.httpServer.on('error', (e) => {
      Logger.log(`Node Media Http Server ${e}`);
    });
  }
}
