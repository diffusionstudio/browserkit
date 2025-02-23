import { Request, Response } from "express";

export function GET(_req: Request, res: Response) {
  res.status(200).json({ status: 'healthy' });
}
