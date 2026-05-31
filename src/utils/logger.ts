import { Signale } from "signale";
import ora, { type Ora } from "ora";
import boxen from "boxen";


class Logger {
  private signale = new Signale();
  private spinner: Ora = ora();

  info(message: string) {
    this.signale.info(message);
  }

  success(message: string) {
    this.signale.success(message);
  }

  warn(message: string) {
    this.signale.warn(message);
  }

  error(message: string | Error) {
    this.signale.error(message);
  }

  start(text: string) {
    this.spinner.start(text);
  }

  update(text: string) {
    this.spinner.text = text;
  }

  stop() {
    this.spinner.stop();
  }

  boxen(message: string, title?: string) {
    console.log(boxen(message, { padding: 1, title, titleAlignment: "center" }));
  }
}

export const logger = new Logger();
