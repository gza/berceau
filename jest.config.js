module.exports = {
  preset: "ts-jest",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.{ts,tsx}", "**/*.(test|spec).{ts,tsx}"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/src/__mocks__/fileMock.js",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/src/__mocks__/fileMock.js",
  },
  // Global setup to create test schemas before running tests
  globalSetup: "<rootDir>/jest.globalSetup.ts",
  // Simplified configuration with separate test environments
  projects: [
    {
      displayName: "node-tests",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: [
        "<rootDir>/src/**/contract/**/?(*.)+(spec|test).ts",
        "<rootDir>/src/**/integration/**/?(*.)+(spec|test).ts",
        "<rootDir>/src/**/*.service.spec.ts",
        "<rootDir>/src/components/**/test/**/?(*.)+(spec|test).ts",
        "<rootDir>/tests/integration/**/?(*.)+(spec|test).ts",
      ],
      transform: {
        "^.+\\.(ts)$": "ts-jest",
      },
      moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/src/__mocks__/fileMock.js",
        "\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$":
          "<rootDir>/src/__mocks__/fileMock.js",
      },
      // maxWorkers controlled via CLI in package.json (--maxWorkers=$JEST_WORKERS)
    },
    {
      displayName: "react-tests",
      preset: "ts-jest",
      testEnvironment: "jsdom",
      testMatch: [
        "<rootDir>/src/**/*.spec.tsx",
        "<rootDir>/src/**/integration/**/?(*.)+(spec|test).tsx",
        "<rootDir>/src/components/**/test/**/?(*.)+(spec|test).tsx",
      ],
      setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
      transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
      },
      moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/src/__mocks__/fileMock.js",
        "\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$":
          "<rootDir>/src/__mocks__/fileMock.js",
      },
    },
  ],
}
