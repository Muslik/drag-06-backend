import { DataSource, QueryRunner } from 'typeorm';

export class Transaction {
  private queryRunner: QueryRunner;

  constructor(dataSource: DataSource) {
    this.queryRunner = dataSource.createQueryRunner();
  }

  async process<T>(
    cb: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();

    try {
      const result = await cb(this.queryRunner);

      return result;
    } catch (error) {
      await this.queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await this.queryRunner.release();
    }
  }
}
