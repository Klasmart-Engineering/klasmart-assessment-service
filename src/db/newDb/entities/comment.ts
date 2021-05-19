/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'comment' })
export abstract class Comment {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string

  @Column()
  readonly message?: string
}
