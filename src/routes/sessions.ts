import { Request, Response } from "express";
import { sessions } from "../sessions";

export function GET(_req: Request, res: Response) {
  res.status(200).json({ count: sessions.size, sessions: Array.from(sessions.keys()) });
}

export async function DELETE(req: Request, res: Response) {
  const sessionId = req.params.id;
  const browser = sessions.get(sessionId);
  if (!browser) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  await browser.close();
  sessions.delete(sessionId);
  res.status(204).send();
}
