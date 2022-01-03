// import { MigrationInterface, QueryRunner } from 'typeorm'

// export class DropAnswerTable1625183413268 implements MigrationInterface {
//   name = 'DropAnswerTable1625183413268'

//   public async up(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(
//       `LOCK TABLE assessment_xapi_migration in ACCESS EXCLUSIVE MODE`,
//     )

//     await queryRunner.query(`DROP TABLE IF EXISTS assessment_xapi_answer`)
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {}
// }
