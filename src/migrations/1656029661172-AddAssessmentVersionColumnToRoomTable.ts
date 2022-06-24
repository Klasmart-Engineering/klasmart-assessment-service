import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAssessmentVersionColumnToRoomTable1656029661172 implements MigrationInterface {
    name = 'AddAssessmentVersionColumnToRoomTable1656029661172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" ADD "assessment_version" smallint`)
        await queryRunner.query(`UPDATE "assessment_xapi_room" SET "assessment_version" = 1`)
        await queryRunner.query(
          `ALTER TABLE "assessment_xapi_room" ALTER COLUMN "assessment_version" SET NOT NULL`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" DROP COLUMN "assessment_version"`)
    }
}
