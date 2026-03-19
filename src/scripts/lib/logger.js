// Set to true locally to enable verbose debug output.
// In production this should be false.
const DEBUG = false;

export const logger = {
  log: (...args) => { if (DEBUG) console.log(...args); },
  warn: (...args) => { if (DEBUG) console.warn(...args); },
  error: (...args) => console.error(...args), // always on — these are real failures
};
