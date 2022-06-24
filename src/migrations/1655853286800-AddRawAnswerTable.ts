import {MigrationInterface, QueryRunner} from "typeorm";

export class AddRawAnswerTable1655853286800 implements MigrationInterface {
    name = 'AddRawAnswerTable1655853286800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assessment_xapi_raw_answer" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "room_id" character varying NOT NULL, "student_id" character varying NOT NULL, "h5p_id" character varying NOT NULL, "h5p_sub_id" character varying, "timestamp" bigint NOT NULL DEFAULT '0', "answer" character varying, "score" integer, "minimum_possible_score" integer, "maximum_possible_score" integer, CONSTRAINT "PK_8c684802ae7f23b229ab66b0b79" PRIMARY KEY ("room_id", "student_id", "h5p_id", "timestamp"))`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "assessment_xapi_raw_answer"`)
    }
}
