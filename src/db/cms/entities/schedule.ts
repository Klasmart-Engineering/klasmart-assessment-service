import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { ObjectType, Field, Directive, ID } from 'type-graphql'

@Directive(`@key(fields: "id")`)
@ObjectType()
@Entity({ name: 'schedules' })
export class Schedule {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string

  @Field(() => ID)
  @Column({ name: 'org_id' })
  readonly orgId!: string
}
