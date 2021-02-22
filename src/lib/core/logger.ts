import * as chalk from 'chalk';

export enum LOG_TYPES {
  NONE = 0,
  ERROR = 1,
  NORMAL = 2,
  DEBUG = 3,
  FFDEBUG = 4,
}

let gLogType = LOG_TYPES.NORMAL;
const setLogType = (type: LOG_TYPES): void => {
  gLogType = type;
};

const logTime = () => {
  const now = new Date();
  return `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour12: false,
  })}`;
};

const log = (...args: any[]): void => {
  if (gLogType < LOG_TYPES.NORMAL) return;
  console.log(logTime(), process.pid, chalk.bold.green('[INFO]'), ...args);
};

const error = (...args: any[]): void => {
  if (gLogType < LOG_TYPES.ERROR) return;
  console.error(logTime(), process.pid, chalk.bold.red('[ERROR]'), ...args);
};

const debug = (...args: any[]): void => {
  if (gLogType < LOG_TYPES.DEBUG) return;
  console.debug(logTime(), process.pid, chalk.bold.blue('[DEBUG]'), ...args);
};

const ffdebug = (...args: any[]): void => {
  if (gLogType < LOG_TYPES.FFDEBUG) return;
  console.debug(logTime(), process.pid, chalk.bold.blue('[FFDEBUG]'), ...args);
};

export const Logger = {
  ffdebug,
  debug,
  log,
  error,
  setLogType,
};
