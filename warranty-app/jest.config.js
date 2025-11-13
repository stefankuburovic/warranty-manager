module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-paper|i18next|react-i18next)',
  ],
  setupFiles: ['<rootDir>/jest.setup.early.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx}',
    '**/*.test.{js,jsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-vector-icons/(.*)$': '<rootDir>/src/__mocks__/vector-icons.js',
    '^@expo/vector-icons/(.*)$': '<rootDir>/src/__mocks__/vector-icons.js',
  },
  testEnvironment: 'node',
};

