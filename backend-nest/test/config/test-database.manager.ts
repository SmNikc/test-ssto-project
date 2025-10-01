import path from 'node:path';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';

/**
 * Менеджер тестовой БД.
 * 1. Если задан `DATABASE_URL`/`DB_URL` — используется он.
 * 2. Если доступен Docker и установлен `@testcontainers/postgresql`, можно заранее выставить `TESTCONTAINERS=true`.
 * 3. По умолчанию запускаем встроенный Postgres через `pg-embed`.
 */
export class TestDatabaseManager {
  private static singleton: TestDatabaseManager | undefined;

  static get instance(): TestDatabaseManager {
    if (!this.singleton) {
      this.singleton = new TestDatabaseManager();
    }
    return this.singleton;
  }

  private connectionString?: string;
  private pgEmbedInstance: any;

  async getConnectionUri(): Promise<string> {
    if (this.connectionString) {
      return this.connectionString;
    }

    const directUrl = process.env.DATABASE_URL || process.env.DB_URL;
    if (directUrl) {
      this.connectionString = directUrl;
      return directUrl;
    }

    // Попытка testcontainers (если разрешено)
    if (process.env.TESTCONTAINERS === 'true') {
      if (!this.moduleAvailable('@testcontainers/postgresql')) {
        console.warn('[TestDatabaseManager] @testcontainers/postgresql не установлен, пропускаем контейнеры');
      } else {
        try {
          const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
          const container = await new PostgreSqlContainer().start();
          this.connectionString = container.getConnectionUri();
          // сохраняем инстанс для последующей остановки
          this.pgEmbedInstance = container;
          return this.connectionString;
        } catch (error) {
          console.warn('[TestDatabaseManager] Не удалось запустить @testcontainers/postgresql:', (error as Error).message);
        }
      }
    }

    // Fallback: pg-embed
    try {
      if (!this.moduleAvailable('pg-embed')) {
        throw new Error('pg-embed module is not installed. Set DATABASE_URL or install pg-embed.');
      }
      const { PgEmbed } = await import('pg-embed');
      const port = Number(process.env.PG_EMBED_PORT) || 5433 + Math.floor(Math.random() * 1000);
      const cacheDir = path.resolve(process.cwd(), process.env.PG_EMBED_CACHE ?? '.pg-embed');
      const instance = new PgEmbed({
        version: process.env.PG_EMBED_VERSION ?? '14.9.0',
        port,
        cacheDir,
        additionalConfig: {
          "listen_addresses": '127.0.0.1',
        },
        database: process.env.PG_EMBED_DATABASE ?? 'ssto_test',
        username: process.env.PG_EMBED_USER ?? 'postgres',
        password: process.env.PG_EMBED_PASSWORD ?? 'postgres',
      });

      await instance.init();
      await instance.start();

      // ожидаем старта процесса
      if (typeof instance.instance !== 'undefined') {
        await once(instance.instance, 'ready').catch(() => undefined);
      }

      const url = instance.getUrl();
      // pg-embed возвращает URL без имени БД, добавим явно
      const database = instance.database ?? 'ssto_test';
      this.connectionString = `${url}/${database}`;
      this.pgEmbedInstance = instance;
      process.env.DATABASE_URL = this.connectionString;
      return this.connectionString;
    } catch (error) {
      throw new Error(
        `Не удалось инициализировать тестовую БД. Укажите DATABASE_URL или установите pg-embed. Оригинальная ошибка: ${(error as Error).message}`,
      );
    }
  }

  async stop(): Promise<void> {
    if (!this.pgEmbedInstance) return;

    if (typeof this.pgEmbedInstance.stop === 'function') {
      await this.pgEmbedInstance.stop();
    } else if (typeof this.pgEmbedInstance.stop === 'object' && this.pgEmbedInstance.stop) {
      await this.pgEmbedInstance.stop();
    }
    this.pgEmbedInstance = undefined;
    this.connectionString = undefined;
  }

  /**
   * Утилита для генерации временных схем/БД.
   */
  generateSchemaName(): string {
    return `ssto_test_${randomUUID().replace(/-/g, '')}`;
  }

  private moduleAvailable(name: string): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require.resolve(name);
      return true;
    } catch {
      return false;
    }
  }
}
