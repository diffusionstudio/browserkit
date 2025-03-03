import express from "express";
import http from "http";
import wsserver from "./websocket";

import * as browsers from "./routes/browsers";
import * as browsers_id from "./routes/browsers/[id]";
import * as browsers_id_tabs from "./routes/browsers/[id]/tabs";
import * as health from "./routes/health";
import * as env from "./environment";

import './utilization';
import './realtime';

export const app = express();
export const server = http.createServer(app);

app.get('/health', health.GET);
app.get('/v1/browsers', browsers.GET);
app.get('/v1/browsers/:id/tabs', browsers_id_tabs.GET);
app.delete('/v1/browsers/:id', browsers_id.DELETE);

server.on('upgrade', wsserver);

/**
 * Start the HTTP/WebSocket server
 */
server.listen(env.PORT, async () => {
  console.log(`Server running on port ${env.PORT}`);
});
