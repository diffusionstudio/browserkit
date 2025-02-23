import WebSocket, { WebSocketServer } from 'ws';
import puppeteer from "puppeteer-core";

import { v4 as uuid } from 'uuid';
import { validateApiKey } from './lib/supabase';
import { sessions } from './sessions';
import { Timeout } from './services';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import * as env from './environment';

export default async function (request: IncomingMessage, socket: Socket, head: Buffer) {
  const sessionId = uuid();
  const wss = new WebSocketServer({ noServer: true });
  const { searchParams } = new URL(request.url!, `http://${request.headers.host}`);
  const apiKey = searchParams.get('token');
  const timeoutMinutes = parseInt(searchParams.get('timeout') || '5');
  console.log('Starting session:', sessionId, 'with timeout:', timeoutMinutes);

  if (!apiKey || !(await validateApiKey(apiKey))) {
    console.log('Unauthorized request');
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: env.CHROME_PATH,
    headless: true,
    args: env.CHROME_ARGS,
  });
  
  sessions.set(sessionId, browser);

  wss.handleUpgrade(request, socket, head, (ws) => {
    const browserWS = new WebSocket(browser.wsEndpoint());
    const timeout = new Timeout(timeoutMinutes, [ws, browserWS, browser]);

    // Forward messages between client and browser
    ws.on('message', (message) => {
      browserWS.send(message.toString());
      timeout.reset(); // Reset timeout on activity
    });

    // Forward messages between browser and client
    browserWS.on('message', (message) => {
      ws.send(message.toString());
      timeout.reset(); // Reset timeout on activity
    });

    // Clean up the browser instance and timeout when the client disconnects
    ws.on('close', async () => {
      timeout.clear();
      browserWS.close();
      await browser.close();
      sessions.delete(sessionId);
    });

    // Clean up the browser instance and timeout when the browser disconnects
    browserWS.on('close', () => {
      timeout.clear();
      ws.close();
      sessions.delete(sessionId);
    });
  });
}
