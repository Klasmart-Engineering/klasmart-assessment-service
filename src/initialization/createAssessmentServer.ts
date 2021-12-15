import path from 'path'
import { ApolloServer } from 'apollo-server-express'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors, { CorsOptions } from 'cors'
import express, { Express } from 'express'
import { checkAuthenticationToken } from 'kidsloop-token-validation'
import appPackage from '../../package.json'
import buildDefaultSchema from './buildDefaultSchema'
import { getConfig } from './configuration'
import { createApolloServer } from './createApolloServer'
import { featureFlags } from './featureFlags'

const routePrefix = process.env.ROUTE_PREFIX || ''
const apiRoute = path.posix.join(
  routePrefix,
  process.env.API_ENDPOINT || '/graphql',
)
const config = getConfig()

const escapeStringRegexp = (value: string): string => {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')
}

const domainRegex = new RegExp(
  `^https://(.*\\.)?${escapeStringRegexp(config.DOMAIN)}(:\\d{1,5})?$`,
)

const corsOptions: CorsOptions = {
  allowedHeaders: ['Authorization', 'Content-Type', 'Correlation-ID'],
  credentials: true,
  maxAge: 60 * 60 * 24, // 1 day
  origin: domainRegex,
}

async function validateToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      console.log(req.cookies.access, req.headers.authorization)
      await checkAuthenticationToken(
        req.headers.authorization || req.cookies.access,
      )
    }
    next()
  } catch (e) {
    console.log(e)
    res.status(401).send(`Missing or invalid token`)
  }
}

function createExpressApp(): Express {
  const app = express()
  app.use(compression())
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ limit: '1mb', extended: true }))
  app.use(cors(corsOptions))

  const viewsPath = path.join(__dirname, '../../views')
  app.use(express.static(viewsPath))
  app.set('views', viewsPath)
  app.set('view engine', 'pug')

  const variables = {
    routePrefix,
    version: appPackage.version,
  }

  app.get(`${routePrefix}`, validateToken, (_, res) => {
    res.render('index', {
      ...variables,
      name: appPackage.name,
      config: {
        DOMAIN: config.DOMAIN,
        USE_ATTENDANCE_API_FLAG: config.USE_ATTENDANCE_API_FLAG,
        USE_XAPI_SQL_DATABASE_FLAG: config.USE_XAPI_SQL_DATABASE_FLAG,
      },
      featureFlags,
    })
  })
  app.get(`${routePrefix}/changelog`, validateToken, (_, res) => {
    res.render('changelog', variables)
  })
  app.get(`${routePrefix}/examples`, validateToken, (_, res) => {
    res.render('examples', variables)
  })
  app.get(`${routePrefix}/explorer`, validateToken, (_, res) => {
    res.render('graphiql', { ...variables, apiRoute })
  })

  app.get(`${routePrefix}/health`, (_, res) => {
    res.status(200).json({
      status: 'pass',
    })
  })

  app.get(`${routePrefix}/version`, (_, res) => {
    res.status(200).json({
      version: `${appPackage.version}`,
    })
  })

  return app
}

export default async function createAssessmentServer(): Promise<{
  app: Express
  apolloServer: ApolloServer
}> {
  const schema = await buildDefaultSchema()
  const apolloServer = createApolloServer(schema)
  await apolloServer.start()

  const app = createExpressApp()
  apolloServer.applyMiddleware({
    app,
    path: apiRoute,
  })
  return { app, apolloServer }
}
