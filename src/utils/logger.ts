import chalk from "chalk";

type ChalkColor =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray"
  | "redBright"
  | "greenBright"
  | "yellowBright"
  | "blueBright"
  | "magentaBright"
  | "cyanBright"
  | "whiteBright";

type LogOptions = {
  label?: string;
  scope?: string;
  color?: ChalkColor;
  timestamp?: boolean;
};

class Logger {

  private log(message: string | Error | unknown, options: LogOptions = {}) {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const { color = "white", timestamp = true, scope, label } = options;

    const timestampStr = timestamp ? `[${time}]` : "";
    const chalkColor = chalk[color];
    const labelStr = label ? `[${label}]` : "[LOG]";
    const scopeStr = scope ? `[${scope}]` : "";

    console.log(
      `${chalk.grey(timestampStr)} ${chalkColor(labelStr)} ${chalk.grey(scopeStr)} ${message}`,
    );
  }

  info(message: string) {
    this.log(message, {
      label: "INFO",
      color: "blue",
    });
  }

  success(message: string) {
    this.log(message, {
      label: "SUCCESS",
      color: "green",
    });
  }

  warn(message: string) {
    this.log(message, {
      label: "WARN",
      color: "yellow",
    });
  }

  error(message: string | Error | unknown) {
    this.log(message, {
      label: "ERROR",
      color: "red",
    });
  }

  custom(message: string, options: LogOptions) {
    this.log(message, options);
  }
}

export const logger = new Logger();
