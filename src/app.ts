import express from "express";
import http from "http";
import wsserver from "./server";

import * as browsers from "./routes/browsers";
import * as health from "./routes/health";
import * as env from "./environment";
import './utilization';

export const app = express();
export const server = http.createServer(app);

app.get('/health', health.GET);
app.get('/v1/browsers', browsers.GET);
app.delete('/v1/browsers/:id', browsers.DELETE);

server.on('upgrade', wsserver);

/**
 * Start the HTTP/WebSocket server
 */
server.listen(env.PORT, async () => {
  console.log(`Server running on port ${env.PORT}`);
});
