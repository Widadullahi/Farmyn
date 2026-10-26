const serverlessExpress = require('@codegenie/serverless-express');
const { configuredApp } = require('./index');
let server;
exports.handler = async (event, context) => {
  server ||= configuredApp().then(app => serverlessExpress({ app }));
  return (await server)(event, context);
};
