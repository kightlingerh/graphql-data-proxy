module.exports = {
    preset: 'ts-jest',
    globals: {
        __DEV__: true,
        __DISABLE_VALIDATION__: false
    },
    testEnvironment: 'node',
    // collectCoverage: true,
    // collectCoverageFrom: [
    //     'src/**/*.ts',
    //     '!src/tree/shared.ts',
    // ],
    // transform: {
    //     '^.+\\.tsx?$': 'ts-jest'
    // },
    testRegex: '__tests__',
    moduleFileExtensions: ['ts', 'js'],
    // coverageThreshold: {
    //     global: {
    //         branches: 100,
    //         functions: 100,
    //         lines: 100,
    //         statements: 100
    //     }
    // },
    modulePathIgnorePatterns: ['shared']
}
