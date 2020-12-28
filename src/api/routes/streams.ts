import * as express from 'express';

import { getStreams } from '../controllers/streams';

export const router = express.Router();

router.get('/', getStreams);
