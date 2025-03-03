import { Request, Response } from "express";

export async function GET(_req: Request, res: Response) {
  res.status(200).send('OK');
}
