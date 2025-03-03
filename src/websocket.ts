import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';

import { getUser } from './supabase';
import { Timeout } from './timeout';
import { Browser } from './browser';
import { logger } from './logger';

/**
 * Handle a WebSocket upgrade request
 * @param request - The incoming request
 * @param socket - The socket
 * @param head - The head
 */
export default async function (request: IncomingMessage, socket: Socket, head: Buffer) {
  const wss = new WebSocketServer({ noServer: true });
  const { searchParams } = new URL(request.url!, `http://${request.headers.host}`);
  const timeoutMinutes = parseInt(searchParams.get('timeout') || '5');
  const user = await getUser(searchParams.get('token'));
  const browser = new Browser(user);

  if (!user) {
    logger.info('Unauthorized request');
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  await browser.init();

  if (!browser.instance) {
    logger.error('Browser instance not initialized');
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, async (ws: WebSocket) => {
    const browserws = new WebSocket(browser.instance!.wsEndpoint());
    const timeout = new Timeout(timeoutMinutes, [browser, ws, browserws]);

    try {
      await whenReady(browserws);

      // Forward messages between client and browser
      ws.on('message', (message: WebSocket.Data) => {
        browserws.send(message.toString());
        timeout.reset(); // Reset timeout on activity
      });

      // Forward messages between browser and client
      browserws.on('message', (message: WebSocket.Data) => {
        ws.send(message.toString());
        timeout.reset(); // Reset timeout on activity
      });

      // Clean up the browser instance and timeout when the client disconnects
      ws.on('close', browserws.close);

      // Clean up the browser instance and timeout when the browser disconnects
      browserws.on('close', () => {
        timeout.clear();
        browser.close();
        ws.close();
      });
    } catch (e) {
      logger.error('Error initializing WebSocket:', e);
      browser.close();
    }
  });
}

/**
 * Wait for a WebSocket to be ready
 * @param ws - The WebSocket to wait for
 * @returns A promise that resolves when the WebSocket is ready
 */
function whenReady(ws: WebSocket) {
  return new Promise((resolve, reject) => {
    if (ws.readyState == WebSocket.OPEN) {
      resolve(null);
    } else {
      ws.on('open', resolve);
      ws.on('error', reject);
    }
  });
}
