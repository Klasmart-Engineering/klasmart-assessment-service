import {MigrationInterface, QueryRunner} from "typeorm";

export class AddCreatedAtUpdatedAtColumns1640249496301 implements MigrationInterface {
    name = 'AddCreatedAtUpdatedAtColumns1640249496301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`LOCK TABLE assessment_xapi_migration in ACCESS EXCLUSIVE MODE`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" RENAME COLUMN "date" TO "created_at"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" RENAME COLUMN "lastUpdated" TO "updated_at"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" ADD "version" integer NULL DEFAULT 1`)
        await queryRunner.query(`UPDATE "assessment_xapi_teacher_comment" SET "version" = 1`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" ALTER COLUMN "version" SET NOT NULL`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" RENAME COLUMN "date" TO "created_at"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" RENAME COLUMN "lastUpdated" TO "updated_at"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" ADD "version" integer NULL DEFAULT 1`)
        await queryRunner.query(`UPDATE "assessment_xapi_teacher_score" SET "version" = 1`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" ALTER COLUMN "version" SET NOT NULL`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" ADD "version" integer NULL DEFAULT 1`)
        await queryRunner.query(`UPDATE "assessment_xapi_room" SET "version" = 1`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" ALTER COLUMN "version" SET NOT NULL`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" ADD "version" integer NULL DEFAULT 1`)
        await queryRunner.query(`UPDATE "assessment_xapi_user_content_score" SET "version" = 1`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" ALTER COLUMN "version" SET NOT NULL`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ADD "version" integer NULL DEFAULT 1`)
        await queryRunner.query(`UPDATE "assessment_xapi_answer" SET "version" = 1`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ALTER COLUMN "version" SET NOT NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`LOCK TABLE assessment_xapi_migration in ACCESS EXCLUSIVE MODE`)
        
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" DROP COLUMN "version"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" DROP COLUMN "updated_at"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" DROP COLUMN "created_at"`)
        
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" DROP COLUMN "version"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" DROP COLUMN "updated_at"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" DROP COLUMN "created_at"`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" DROP COLUMN "version"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" DROP COLUMN "updated_at"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" DROP COLUMN "created_at"`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" RENAME COLUMN "created_at" TO "date"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" RENAME COLUMN "updated_at" TO "lastUpdated"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" DROP COLUMN "version"`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" RENAME COLUMN "created_at" TO "date"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" RENAME COLUMN "updated_at" TO "lastUpdated"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" DROP COLUMN "version"`)
    }

}
