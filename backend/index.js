const { buildApp } = require("../dist/src/app.js");

let app;

module.exports = async (req, res) => {
  if (!app) {
    app = buildApp();
    await app.ready();
  }

  // Handle the request
  await app.server.emit("request", req, res);
};
