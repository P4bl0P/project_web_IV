import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    // Esto mapea las rutas relativas internas si hiciera falta
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Forzamos a Jest a tratar node_modules como transformables para ESM
  transformIgnorePatterns: ['node_modules/(?!@nestjs|rxjs)'],
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

export default config;