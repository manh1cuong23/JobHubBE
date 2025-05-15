/* eslint-disable no-undef */
module.exports = {
  apps: [
    {
      name: 'apitwitter',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
