import { Connection, useContainer } from 'typeorm'
import { Container } from 'typeorm-typedi-extensions'
import { Container as MutableContainer } from 'typedi'
import { createApolloServer } from '../../src/helpers/createApolloServer'
import { buildDefaultSchema } from '../../src/helpers/buildDefaultSchema'
import { ApolloServerTestClient, createTestClient } from './createTestClient'
import {
  createBootstrapPostgresConnection,
  createTestConnections,
} from './testConnection'
import { Substitute } from '@fluffy-spoon/substitute'
import { ILogger, Logger } from '../../src/helpers/logger'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(__dirname, '../.env') })

export let connections: Connection[]
export let testClient: ApolloServerTestClient

before(async () => {
  await createAssessmentDbIfItDoesntExist()
  useContainer(Container)
  const schema = await buildDefaultSchema()
  const server = createApolloServer(schema)
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
