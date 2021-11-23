import path from 'path'
import dotenv from 'dotenv'
import { Connection, useContainer } from 'typeorm'
import { Container } from 'typeorm-typedi-extensions'
import { Container as MutableContainer } from 'typedi'
import { Substitute } from '@fluffy-spoon/substitute'

import { ApolloServerTestClient, createTestClient } from './createTestClient'
import {
  createBootstrapPostgresConnection,
  createTestConnections,
} from './testConnection'
import { ILogger, Logger } from '../../src/helpers/logger'
import createAssessmentServer from '../../src/helpers/createAssessmentServer'
import { AttendanceApi, UserApi } from '../../src/api'
import { IXApiRepository } from '../../src/db/xapi'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

export let connections: Connection[]
export let testClient: ApolloServerTestClient

before(async () => {
  await createAssessmentDbIfItDoesntExist()
  useContainer(Container)
  const { server } = await createAssessmentServer()
  testClient = createTestClient(server)
  Logger.register(() => Substitute.for<ILogger>())
})

export async function dbConnect(): Promise<void> {
  connections = await Promise.all(createTestConnections())
}

export async function dbDisconnect(): Promise<void> {
  await Promise.all(connections?.map((x) => x.close()) || [])
  MutableContainer.reset()
}

export async function dbSynchronize(): Promise<void> {
  await Promise.all(connections?.map((x) => x.synchronize(true)))
}

async function createAssessmentDbIfItDoesntExist(): Promise<void> {
  const connection = await createBootstrapPostgresConnection()
  const queryRunner = connection.createQueryRunner()
  if (
    (
      await connection.query(
        "SELECT datname FROM pg_catalog.pg_database WHERE datname = 'test_assessment_db';",
      )
    ).length == 0
  ) {
    await connection.query('CREATE DATABASE test_assessment_db;')
  }
  if (
    (
      await connection.query(
        "SELECT datname FROM pg_catalog.pg_database WHERE datname = 'test_xapi_db';",
      )
    ).length == 0
  ) {
    await connection.query('CREATE DATABASE test_xapi_db;')
  }

  await queryRunner.release()
  await connection.close()
}

export const createSubstitutesToExpectedInjectableServices = () => {
  const attendanceApi = Substitute.for<AttendanceApi>()
  MutableContainer.set(AttendanceApi, attendanceApi)
  const userApi = Substitute.for<UserApi>()
  MutableContainer.set(UserApi, userApi)
  const xapiRepository = Substitute.for<IXApiRepository>()
  MutableContainer.set('IXApiRepository', xapiRepository)
  return {
    attendanceApi,
    userApi,
    xapiRepository,
  }
}
