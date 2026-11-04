import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const workingDirectory = process.cwd();
const rootEnv = workingDirectory.endsWith('/backend')
  ? resolve(workingDirectory, '..', '.env')
  : resolve(workingDirectory, '.env');

if (existsSync(rootEnv)) config({ path: rootEnv });
