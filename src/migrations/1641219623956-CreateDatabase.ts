import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateDatabase1641219623956 implements MigrationInterface {
    name = 'CreateDatabase1641219623956'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "assessment_xapi_teacher_comment" ("room_id" character varying NOT NULL, "teacher_id" character varying NOT NULL, "student_id" character varying NOT NULL, "roomRoomId" character varying NOT NULL, "date" TIMESTAMP NOT NULL DEFAULT now(), "lastUpdated" TIMESTAMP NOT NULL DEFAULT now(), "comment" character varying NOT NULL, CONSTRAINT "PK_8420b9eb9ef17399d9677ab2329" PRIMARY KEY ("room_id", "teacher_id", "student_id"))`)
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "assessment_xapi_room" ("room_id" character varying NOT NULL, "startTime" TIMESTAMP, "endTime" TIMESTAMP, "recalculate" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_70f65692c1c826674104aa6c983" PRIMARY KEY ("room_id"))`)
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "assessment_xapi_teacher_score" ("room_id" character varying NOT NULL, "student_id" character varying NOT NULL, "content_id" character varying NOT NULL, "teacher_id" character varying NOT NULL, "date" TIMESTAMP NOT NULL DEFAULT now(), "lastUpdated" TIMESTAMP NOT NULL DEFAULT now(), "score" real NOT NULL DEFAULT '0', "userContentScoreRoomId" character varying, "userContentScoreStudentId" character varying, "userContentScoreContentKey" character varying, CONSTRAINT "PK_0635333ae0b87c23b09cd2b3fb2" PRIMARY KEY ("room_id", "student_id", "content_id", "teacher_id"))`)
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "assessment_xapi_user_content_score" ("room_id" character varying NOT NULL, "student_id" character varying NOT NULL, "content_id" character varying NOT NULL, "seen" boolean NOT NULL DEFAULT false, "contentType" character varying, "contentName" character varying, "contentParentId" character varying, "roomRoomId" character varying, CONSTRAINT "PK_26ee95476b7f319a923db88853f" PRIMARY KEY ("room_id", "student_id", "content_id"))`)
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "assessment_xapi_answer" ("room_id" character varying NOT NULL, "student_id" character varying NOT NULL, "content_id" character varying NOT NULL, "timestamp" TIMESTAMP NOT NULL, "answer" character varying, "score" integer, "minimum_possible_score" integer, "maximum_possible_score" integer, "userContentScoreRoomId" character varying, "userContentScoreStudentId" character varying, "userContentScoreContentKey" character varying, CONSTRAINT "PK_4152b79edecd2ec1205759c7c32" PRIMARY KEY ("room_id", "student_id", "content_id", "timestamp"))`)
        
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" DROP CONSTRAINT IF EXISTS "FK_2da8904c6ddc72e3b8db457816d"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" ADD CONSTRAINT "FK_2da8904c6ddc72e3b8db457816d" FOREIGN KEY ("roomRoomId") REFERENCES "assessment_xapi_room"("room_id") ON DELETE CASCADE ON UPDATE CASCADE`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" DROP CONSTRAINT IF EXISTS "FK_c864a929175036db56436609b26"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" ADD CONSTRAINT "FK_c864a929175036db56436609b26" FOREIGN KEY ("userContentScoreRoomId", "userContentScoreStudentId", "userContentScoreContentKey") REFERENCES "assessment_xapi_user_content_score"("room_id","student_id","content_id") ON DELETE CASCADE ON UPDATE CASCADE`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" DROP CONSTRAINT IF EXISTS "FK_b924878d94c06b34ee054c330e1"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" ADD CONSTRAINT "FK_b924878d94c06b34ee054c330e1" FOREIGN KEY ("roomRoomId") REFERENCES "assessment_xapi_room"("room_id") ON DELETE CASCADE ON UPDATE CASCADE`)

        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" DROP CONSTRAINT IF EXISTS "FK_2af34c7a831bccebfd64a536002"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" ADD CONSTRAINT "FK_2af34c7a831bccebfd64a536002" FOREIGN KEY ("userContentScoreRoomId", "userContentScoreStudentId", "userContentScoreContentKey") REFERENCES "assessment_xapi_user_content_score"("room_id","student_id","content_id") ON DELETE CASCADE ON UPDATE CASCADE`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessment_xapi_answer" DROP CONSTRAINT "FK_2af34c7a831bccebfd64a536002"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_user_content_score" DROP CONSTRAINT "FK_b924878d94c06b34ee054c330e1"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_score" DROP CONSTRAINT "FK_c864a929175036db56436609b26"`)
        await queryRunner.query(`ALTER TABLE "assessment_xapi_teacher_comment" DROP CONSTRAINT "FK_2da8904c6ddc72e3b8db457816d"`)
        await queryRunner.query(`DROP TABLE "assessment_xapi_answer"`)
        await queryRunner.query(`DROP TABLE "assessment_xapi_user_content_score"`)
        await queryRunner.query(`DROP TABLE "assessment_xapi_teacher_score"`)
        await queryRunner.query(`DROP TABLE "assessment_xapi_room"`)
        await queryRunner.query(`DROP TABLE "assessment_xapi_teacher_comment"`)
    }

}
