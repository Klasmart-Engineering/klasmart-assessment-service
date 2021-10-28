#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { getAssessmentDatabaseConnectionOptions } from '../src/db/assessments/connectToAssessmentDatabase'

const assessmentDatabaseUrl = process.env.ASSESSMENT_DATABASE_URL
if (!assessmentDatabaseUrl) {
  throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
}

const config = getAssessmentDatabaseConnectionOptions(assessmentDatabaseUrl)
const configPath = path.join(__dirname, '../ormConfig.json')

fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

console.log(
  `TyprORM config saved to ${path.relative(process.cwd(), configPath)}`,
)
