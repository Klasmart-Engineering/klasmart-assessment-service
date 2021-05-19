import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Service } from 'typedi'
import { Attendance, User } from './entities'

@Service()
export class UserRepo {
  constructor(
    @InjectRepository(Attendance, 'users')
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(User, 'users')
    private readonly userRepository: Repository<User>,
  ) {}

  public async getUser(userId: string): Promise<User> {
    console.info('Unauthenticated endpoint call getUser')
    const user = await this.userRepository.findOneOrFail(userId)
    return user
  }

  public async searchAttendances({
    roomId,
    joinAfter,
    leaveBefore,
  }: {
    roomId?: string
    joinAfter?: Date
    leaveBefore?: Date
  }): Promise<Attendance[]> {
    console.info('Unauthenticated endpoint call searchAttendances')

    if (!roomId) {
      throw new Error('roomId is required.')
    }

    const query = this.attendanceRepository.createQueryBuilder()
    if (roomId) {
      query.andWhere('Attendance.room_id = :roomId', {
        roomId,
      })
    }
    if (joinAfter) {
      query.andWhere('Attendance.joinTimestamp >= :joinAfter', {
        joinAfter,
      })
    }
    if (leaveBefore) {
      query.andWhere('Attendance.leaveTimestamp <= :leaveBefore', {
        leaveBefore,
      })
    }
    const attendances = await query.getMany()

    return attendances
  }
}
