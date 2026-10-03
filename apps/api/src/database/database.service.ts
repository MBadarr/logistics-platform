import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { createDatabase } from 'database';
import { requiredEnv } from '../config/environment.js';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly connection = createDatabase(process.env.DATABASE_URL_POOLED?.trim() || requiredEnv('DATABASE_URL'));
  readonly db = this.connection.db;

  async onModuleDestroy() {
    await this.connection.pool.end();
  }
}
