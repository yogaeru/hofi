import { Signale, type SignaleOptions } from "signale";
import ora, { type Ora } from "ora";
import boxen from "boxen";

type enumSignale = "info" | "success" | "warn" | "error" | "add" | "remove";

const configSignale = {
  displayFilename: false,
  displayBadge: true,
  displayLabel: true,
  displayScope: true,
  displayTimestamp: true,
};

const typesSignale = {
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
};

const signaleCompactOptions = {
  config: {
    ...configSignale,
    displayTimestamp: false,
  },
  types: {
    add: {
      badge: " ",
      color: "green",
      label: "[A.]",
      logLevel: "info",
    },
    remove: {
      badge: " ",
      color: "red",
      label: "[R.]",
      logLevel: "info",
      displayTimestamp: false,
    },
  },
};

class Logger {
  private signale: Signale<enumSignale>;
  private signaleCompact: Signale<enumSignale>;
  private spinner: Ora = ora();

  private readonly options: SignaleOptions<enumSignale> = {
    stream: process.stdout,
    config: configSignale,
    types: typesSignale,
  };

  constructor() {
    this.signale = new Signale(this.options);
    this.signaleCompact = new Signale(signaleCompactOptions);
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
  error(message: string | Error | unknown) {
    this.signale.error(message);
  }

  /**
   * Logs an add message.
   *
   * @param message The message to log.
   */
  add(message: string) {
    this.signaleCompact.add(message);
  }

  /**
   * Removes the spinner.
   */
  remove(message: string) {
    this.signaleCompact.remove(message);
  }

  /**
   * Starts the spinner with the provided text.
   *
   * @param text The spinner text.
   */
  spinStart(text: string) {
    this.spinner.start(text);
  }

  /**
   * Updates the spinner text.
   *
   * @param text The new spinner text.
   */
  spinUpdate(text: string) {
    this.spinner.text = text;
  }

  /**
   * Stops the spinner.
   */
  spinStop() {
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
