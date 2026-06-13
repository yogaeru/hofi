import { Signale, type SignaleOptions } from "signale";
import ora, { type Ora } from "ora";
import boxen from "boxen";

class Logger {
  private signale: Signale;
  private spinner: Ora = ora();

  private readonly options: SignaleOptions<
    "info" | "success" | "warn" | "error"
  > = {
    stream: process.stdout,
    config: {
      displayBadge: false,
      displayLabel: true,
      displayScope: false,
      displayTimestamp: true,
    },
    types: {
      info: {
        badge: "",
        color: "blue",
        label: "[INFO]",
        logLevel: "info",
      },

      success: {
        badge: "",
        color: "green",
        label: "[SUCCESS]",
        logLevel: "info",
      },

      warn: {
        badge: "",
        color: "yellow",
        label: "[WARN]",
        logLevel: "warn",
      },

      error: {
        badge: "",
        color: "red",
        label: "[ERROR]",
        logLevel: "error",
      },
    },
  };

  constructor() {
    this.signale = new Signale(this.options);
  }

  /**
   * Logs an informational message.
   *
   * @param message The message to log.
   */
  info(message: string) {
    this.signale.info(message);
  }

  /**
   * Logs a success message.
   *
   * @param message The message to log.
   */
  success(message: string) {
    this.signale.success(message);
  }

  /**
   * Logs a warning message.
   *
   * @param message The message to log.
   */
  warn(message: string) {
    this.signale.warn(message);
  }

  /**
   * Logs an error message.
   *
   * @param message The message or error to log.
   */
  error(message: string | Error) {
    this.signale.error(message);
  }

  /**
   * Starts the spinner with the provided text.
   *
   * @param text The spinner text.
   */
  start(text: string) {
    this.spinner.start(text);
  }

  /**
   * Updates the spinner text.
   *
   * @param text The new spinner text.
   */
  update(text: string) {
    this.spinner.text = text;
  }

  /**
   * Stops the spinner.
   */
  stop() {
    this.spinner.stop();
  }

  /**
   * Prints a message inside a box.
   *
   * @param message The message to display.
   * @param title The optional box title.
   */
  boxen(message: string, title?: string) {
    console.log(
      boxen(message, { padding: 1, title, titleAlignment: "center" }),
    );
  }
}

/**
 * Shared logger instance used across the app.
 */
export const logger = new Logger();
