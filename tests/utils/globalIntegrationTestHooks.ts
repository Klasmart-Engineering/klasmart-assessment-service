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

export let connections: Connection[]
export let testClient: ApolloServerTestClient

before(async () => {
  await createUserDbIfItDoesntExist()
  useContainer(Container)
  const schema = await buildDefaultSchema()
  const server = createApolloServer(schema)
  testClient = createTestClient(server)
})

beforeEach(async () => {
  connections = await Promise.all(createTestConnections())
})

afterEach(async () => {
  await Promise.all(connections?.map((x) => x.close()) || [])
  MutableContainer.reset()
})

async function createUserDbIfItDoesntExist(): Promise<void> {
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

  await queryRunner.release()
  await connection.close()
}
