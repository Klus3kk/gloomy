const functions = require("firebase-functions");
const { default: next } = require("next");

const app = next({ dev: false, conf: { output: "standalone" } });
const handle = app.getRequestHandler();

exports.nextApi = functions.https.onRequest((req, res) => {
  return app.prepare().then(() => handle(req, res));
});
