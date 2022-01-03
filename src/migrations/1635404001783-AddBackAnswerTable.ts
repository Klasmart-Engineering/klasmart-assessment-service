// import {MigrationInterface, QueryRunner} from "typeorm";

// export class AddBackAnswerTable1635404001783 implements MigrationInterface {
//     name = 'AddBackAnswerTable1635404001783'

//     public async up(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`LOCK TABLE assessment_xapi_migration in ACCESS EXCLUSIVE MODE`)

//         await queryRunner.query(`DROP TABLE IF EXISTS assessment_xapi_answer`)
//         await queryRunner.query(`CREATE TABLE "assessment_xapi_answer" ("room_id" character varying NOT NULL, "student_id" character varying NOT NULL, "content_id" character varying NOT NULL, "timestamp" bigint NOT NULL DEFAULT '0', "answer" character varying, "score" integer, "minimum_possible_score" integer, "maximum_possible_score" integer, "userContentScoreRoomId" character varying, "userContentScoreStudentId" character varying, "userContentScoreContentKey" character varying, CONSTRAINT "PK_4152b79edecd2ec1205759c7c32" PRIMARY KEY ("room_id", "student_id", "content_id", "timestamp"))`)
//         await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ADD CONSTRAINT "FK_2af34c7a831bccebfd64a536002" FOREIGN KEY ("userContentScoreRoomId", "userContentScoreStudentId", "userContentScoreContentKey") REFERENCES "assessment_xapi_user_content_score"("room_id","student_id","content_id") ON DELETE CASCADE ON UPDATE CASCADE`)
//     }

//     public async down(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`LOCK TABLE assessment_xapi_migration in ACCESS EXCLUSIVE MODE`)

//         await queryRunner.query(`DROP TABLE "assessment_xapi_answer"`);
//         await queryRunner.query(`CREATE TABLE "assessment_xapi_answer" ("room_id" character varying NOT NULL, "student_id" character varying NOT NULL, "content_id" character varying NOT NULL, "timestamp" timestamp without time zone NOT NULL , "answer" character varying, "score" integer, "minimum_possible_score" integer, "maximum_possible_score" integer, "userContentScoreRoomId" character varying, "userContentScoreStudentId" character varying, "userContentScoreContentKey" character varying, CONSTRAINT "PK_4152b79edecd2ec1205759c7c32" PRIMARY KEY ("room_id", "student_id", "content_id", "timestamp"))`)
//     }

// }
