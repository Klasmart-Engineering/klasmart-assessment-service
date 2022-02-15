import {MigrationInterface, QueryRunner} from "typeorm";

export class AddAttendanceCountColumnToRoomTable1643849818116 implements MigrationInterface {
    name = 'AddAttendanceCountColumnToRoomTable1643849818116'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" ADD "attendance_count" smallint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessment_xapi_room" DROP COLUMN "attendance_count"`);
    }

}
