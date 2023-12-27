const commonConfig = require('./jest.config');

module.exports = {
  ...commonConfig,
  testRegex: '/src/.*\\.(spec|test)\\.ts$',
};
