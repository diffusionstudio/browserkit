import express from "express";
import http from "http";
import wsserver from "./server";

import * as sessions from "./routes/sessions";
import * as health from "./routes/health";
import * as env from "./environment";

export const app = express();
export const server = http.createServer(app);

app.get('/health', health.GET);
app.get('/sessions', sessions.GET);
app.delete('/sessions/:id', sessions.DELETE);

server.on('upgrade', wsserver);

/**
 * Start the HTTP/WebSocket server
 */
server.listen(env.PORT, async () => {
  console.log(`Server running on port ${env.PORT}`);
});
