import * as _ from 'lodash';

export function authCheck(req, res, next) {
  if (!_.get(req.nms, ['config', 'api', 'token'])) {
    return next();
  }

  if (_.get(req.nms, ['config', 'api', 'token']) !== req.headers.token) {
    return res.status(401).json({ error: 'not_authorized' });
  }

  next();
}
