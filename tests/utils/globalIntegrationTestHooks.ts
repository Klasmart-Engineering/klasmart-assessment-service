import Substitute, { SubstituteOf } from '@fluffy-spoon/substitute'
import { Connection, useContainer } from 'typeorm'
import { Container } from 'typeorm-typedi-extensions'
import { createApolloServer } from '../../src/helpers/createApolloServer'
import { XAPIRepository } from '../../src/db/xapi/repo'
import { buildDefaultSchema } from '../../src/helpers/buildDefaultSchema'
import { ApolloServerTestClient, createTestClient } from './createTestClient'
import {
  createBootstrapPostgresConnection,
  createTestConnections,
} from './testConnection'
import { Container as MutableContainer } from 'typedi'

export let connections: Connection[]
export let testClient: ApolloServerTestClient
export let xapiRepository: SubstituteOf<XAPIRepository>

before(async () => {
  xapiRepository = Substitute.for<XAPIRepository>()
  MutableContainer.set(XAPIRepository, xapiRepository)
  useContainer(Container)

  await createUserDbIfItDoesntExist()

  connections = await Promise.all(createTestConnections())
  const schema = await buildDefaultSchema()
  const server = createApolloServer(schema)
  testClient = createTestClient(server)
})

after(async () => {
  await Promise.all(connections?.map((x) => x.close()) || [])
})

afterEach(async () => {
  await Promise.all(connections?.map((x) => x.synchronize(true)) || [])
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
