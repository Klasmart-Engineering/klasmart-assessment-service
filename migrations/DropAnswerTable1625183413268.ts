import { MigrationInterface, QueryRunner } from 'typeorm'

// At the time of writing, the answer table isn't being utilized at all.
// It was meant for caching, but the caching feature had to be disabled
// due to edge cases. Caching will likely be introduced at some point,
// but we could benefit from dropping the table for now because
// 1) we can get rid of stale entries
// 2) we had to change the timestamp column type from timestamp to bigint,
// which isn't conversion-friendly.
export class DropAnswerTable1625183413268 implements MigrationInterface {
  name = 'DropAnswerTable1625183413268'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS assessment_xapi_answer`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    return Promise.resolve()
  }
}
