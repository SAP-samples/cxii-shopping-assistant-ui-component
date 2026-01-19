
export abstract class ILoggerService {
  /**
   * Log an info message
   */
  abstract info(marker: string, ...args: any[]): void;

  /**
   * Log a warning message
   */
  abstract warn(marker: string, ...args: any[]): void;

  /**
   * Log an error message
   */
  abstract error(marker: string, ...args: any[]): void;

  abstract debug(marker: string, ...args: any[]): void;
}
