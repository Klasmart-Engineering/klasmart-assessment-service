import { MigrationInterface, QueryRunner } from "typeorm"

export class AddBackAnswerTable1641219623957 implements MigrationInterface {
    name = 'AddBackAnswerTable1641219623957'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`LOCK TABLE assessment_xapi_migration in ACCESS EXCLUSIVE MODE`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" RENAME COLUMN "timestamp" TO "timestamp_epoch"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ALTER COLUMN "timestamp_epoch" TYPE bigint USING extract(epoch from "timestamp_epoch") * 1000 + floor(random()*1000)`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ALTER COLUMN "timestamp_epoch" SET NOT NULL`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ALTER COLUMN "timestamp_epoch" SET DEFAULT '0'`)
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`LOCK TABLE assessment_xapi_migration in ACCESS EXCLUSIVE MODE`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" RENAME COLUMN "timestamp_epoch" TO "timestamp"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ALTER COLUMN "timestamp" DROP DEFAULT`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ALTER COLUMN "timestamp" TYPE timestamp without time zone USING TO_TIMESTAMP("timestamp" / 1000)::timestamp without time zone`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ALTER COLUMN "timestamp" SET NOT NULL`)
    }

}
