import WebSocket, { WebSocketServer } from 'ws';

import { getUser } from './lib/supabase';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { Timeout } from './timeout';
import { Browser } from './browser';

export default async function (request: IncomingMessage, socket: Socket, head: Buffer) {
  const wss = new WebSocketServer({ noServer: true });
  const { searchParams } = new URL(request.url!, `http://${request.headers.host}`);
  const timeoutMinutes = parseInt(searchParams.get('timeout') || '5');
  const user = await getUser(searchParams.get('token'));
  const browser = new Browser(user);

  if (!user) {
    console.log('Unauthorized request');
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  await browser.init();

  if (!browser.instance) {
    console.error('Browser instance not initialized');
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
    const browserWS = new WebSocket(browser.instance!.wsEndpoint());
    const timeout = new Timeout(timeoutMinutes, [ws, browserWS, browser]);

    new Promise(resolve => browserWS.on('open', resolve)).then(() => {
      // Forward messages between client and browser
      ws.on('message', (message: WebSocket.Data) => {
        browserWS.send(message.toString());
        timeout.reset(); // Reset timeout on activity
      });

      // Forward messages between browser and client
      browserWS.on('message', (message: WebSocket.Data) => {
        ws.send(message.toString());
        timeout.reset(); // Reset timeout on activity
      });
    })

    // Clean up the browser instance and timeout when the client disconnects
    ws.on('close', timeout.terminate.bind(timeout));

    // Clean up the browser instance and timeout when the browser disconnects
    browserWS.on('close', timeout.terminate.bind(timeout));
  });
}
