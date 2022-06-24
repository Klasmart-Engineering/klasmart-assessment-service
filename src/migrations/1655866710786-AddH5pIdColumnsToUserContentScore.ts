import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddH5pIdColumnsToUserContentScore1655866710786 implements MigrationInterface {
    name = 'AddH5pIdColumnsToUserContentScore1655866710786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" ADD "h5p_id" character varying`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" ADD "h5p_sub_id" character varying`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" DROP COLUMN "h5p_sub_id"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" DROP COLUMN "h5p_id"`)
    }
}
