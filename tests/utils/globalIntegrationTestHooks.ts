import path from 'path'
import { Connection, useContainer } from 'typeorm'
import { Container } from 'typeorm-typedi-extensions'
import { Container as MutableContainer } from 'typedi'
import { Substitute } from '@fluffy-spoon/substitute'

import { ApolloServerTestClient, createTestClient } from './createTestClient'
import {
  createBootstrapPostgresConnection,
  createTestConnections,
} from './testConnection'
import createAssessmentServer from '../../src/initialization/createAssessmentServer'
import { ICache, InMemoryCache } from '../../src/cache'
import { IXApiRepository } from '../../src/db/xapi'
import { RoomAttendanceApiProvider } from '../../src/providers/roomAttendanceProvider'
import { AttendanceApi } from '../../src/web'
import DiKeys from '../../src/initialization/diKeys'

export let connections: Connection[]
export let testClient: ApolloServerTestClient

before(async () => {
  await createAssessmentDbIfItDoesntExist()
  useContainer(Container)
  const { apolloServer } = await createAssessmentServer()
  testClient = createTestClient(apolloServer)
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
        "SELECT datname FROM pg_catalog.pg_database WHERE datname = 'test_attendance_db';",
      )
    ).length == 0
  ) {
    await connection.query('CREATE DATABASE test_attendance_db;')
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
  MutableContainer.set(
    'RoomAttendanceProvider',
    new RoomAttendanceApiProvider(attendanceApi),
  )
  const xapiRepository = Substitute.for<IXApiRepository>()
  MutableContainer.set(DiKeys.IXApiRepository, xapiRepository)
  const cache: ICache = new InMemoryCache()
  MutableContainer.set(DiKeys.ICache, cache)
  return {
    attendanceApi,
    xapiRepository,
    cache,
  }
}
