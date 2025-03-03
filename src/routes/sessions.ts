import { Request, Response } from "express";
import { browsers } from "../browser";
import { MAX_BROWSER_INSTANCES } from "../environment";

export function GET(_req: Request, res: Response) {
  res.status(200).json({ 
    count: browsers.size,
    browsers: Array.from(browsers.keys()),
    capacity: MAX_BROWSER_INSTANCES,
  });
}

export async function DELETE(req: Request, res: Response) {
  const sessionId = req.params.id;
  const browser = browsers.get(sessionId);
  if (!browser) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  await browser.close();
  browsers.delete(sessionId);
  res.status(204).send();
}
