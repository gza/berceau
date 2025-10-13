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
  // Simplified configuration with separate test environments
  projects: [
    {
      displayName: "node-tests",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: [
        "<rootDir>/src/**/contract/**/*.spec.ts",
        "<rootDir>/src/**/*.service.spec.ts",
      ],
      transform: {
        "^.+\\.(ts)$": "ts-jest",
      },
      moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/src/__mocks__/fileMock.js",
        "\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$":
          "<rootDir>/src/__mocks__/fileMock.js",
      },
    },
    {
      displayName: "react-tests",
      preset: "ts-jest",
      testEnvironment: "jsdom",
      testMatch: [
        "<rootDir>/src/**/*.spec.tsx",
        "<rootDir>/src/**/integration/**/*.spec.tsx",
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
