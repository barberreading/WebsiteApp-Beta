module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setup.js'],
    testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
    coveragePathIgnorePatterns: [
        '/node_modules/'
    ]
};