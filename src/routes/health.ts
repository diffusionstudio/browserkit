import { Request, Response } from "express";
import { getSystemInfo } from "../lib/systeminfo";

export async function GET(_req: Request, res: Response) {
  res.status(200).json(await getSystemInfo());
}
