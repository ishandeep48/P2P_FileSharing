// Transfer-related constants used by sender/receiver hooks.
export const CHUNK_SIZE = 256 * 1024;
export const MAX_BUFFERED_AMOUNT = 15 * 1024 * 1024;
export const THROTTLE_DELAY = 5;
export const BUFFERED_AMOUNT_LOW_THRESHOLD = 128 * 1024;
export const SPEED_UPDATE_INTERVAL_MS = 500;
export const PROGRESS_UPDATE_INTERVAL_MS = 100;
export const APPROVAL_POLL_INTERVAL_MS = 100;
export const DEFAULT_FILE_NAME = "received_file";
export const DEFAULT_FILE_TYPE = "text/plain";
export const EOF_MARKER = "__EOF__";
export const EOF_ACK_MARKER = "__EOF_ACK__";
