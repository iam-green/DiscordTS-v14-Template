export class Log {
  static _date() {
    const date = new Date();
    const year = date.getFullYear().toString().padStart(4, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
  }

  static info(content: string) {
    console.log(
      `${'['.cyan}${'INFO'.green}${']'.cyan} ${'('.cyan}${this._date().yellow}${')'.cyan} ${content}`,
    );
  }

  static debug(content: string) {
    if (process.env.NODE_ENV == 'development')
      console.log(
        `${'['.cyan}${'DEBUG'.magenta}${']'.cyan} ${'('.cyan}${this._date().yellow}${')'.cyan} ${content}`,
      );
  }

  static warn(content: string) {
    console.log(
      `${'['.cyan}${'WARN'.yellow}${']'.cyan} ${'('.cyan}${this._date().yellow}${')'.cyan} ${content}`,
    );
  }

  static error(error, file?: string) {
    console.log(
      `${'['.cyan}${'ERROR'.red}${']'.cyan} ${'('.cyan}${this._date().yellow}${')'.cyan} ${
        typeof error == 'string'
          ? error.red
          : [
              `${error.name} - ${error.message}`,
              `File : ${file || error.fileName}`,
              `Stack : ${error.stack.replace(/\n/g, '\n\t')}`,
            ].join('\n\t').red
      }`,
    );
  }
}
