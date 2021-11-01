import { MigrationInterface, QueryRunner } from 'typeorm'

export class MigrationLock1627128803380 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Since all migrations run in a single transaction, we can lock the migration table
    // to prevent other instances from running migrations

    // Use an exclusive lock on the migrations table so that connection.showMigrations()
    // will stall and eventually return false if another instance is already running migrations
    await queryRunner.query(
      `LOCK TABLE assessment_xapi_migration in ACCESS EXCLUSIVE MODE;`,
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    return Promise.resolve()
  }
}
