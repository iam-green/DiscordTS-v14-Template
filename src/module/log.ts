import chalk from 'chalk';

export class Log {
  static date() {
    const date = new Date();
    const year = date.getFullYear().toString().padStart(4, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
  }

  static prefix(type: string, color: (str: string) => string) {
    return `${chalk.cyan('[')}${color(type)}${chalk.cyan(']')} ${chalk.cyan('(')}${chalk.yellow(this.date())}${chalk.cyan(')')}`;
  }

  static info(content: string) {
    console.log(
      `${this.prefix('INFO', chalk.green)} ${content.replace(/\n/g, '\n\t')}`,
    );
  }

  static debug(content: string) {
    if (process.env.NODE_ENV == 'development')
      console.log(
        `${this.prefix('DEBUG', chalk.magenta)} ${content.replace(/\n/g, '\n\t')}`,
      );
  }

  static warn(content: string) {
    if (
      process.env.NODE_ENV == 'development' ||
      process.env.SHOW_WARN == 'true'
    )
      console.log(
        `${this.prefix('WARN', chalk.yellow)} ${content.replace(
          /\n/g,
          '\n\t',
        )}`,
      );
  }

  static error(error, file?: string) {
    console.log(
      `${this.prefix('ERROR', chalk.red)} ${chalk
        .red(
          typeof error == 'string'
            ? error
            : [
                `${error.name} - ${error.message}`,
                `File : ${file || error.fileName}`,
                `Stack : ${error.stack}`,
              ].join('\n'),
        )
        .replace(/\n/g, '\n\t')}`,
    );
  }
}
