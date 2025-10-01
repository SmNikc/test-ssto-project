declare module 'pg-embed' {
  export class PgEmbed {
    constructor(options: any);
    init(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getUrl(): string;
    readonly instance: any;
    readonly database: string;
  }
}

declare module '@testcontainers/postgresql' {
  export class PostgreSqlContainer {
    start(): Promise<{ getConnectionUri(): string; stop(): Promise<void> }>;
  }
}
