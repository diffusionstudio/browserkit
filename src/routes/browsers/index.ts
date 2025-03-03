import { Request, Response } from "express";
import { getUser, supabase } from "../../lib/supabase";

export async function GET(req: Request, res: Response) {
  const user = await getUser(req.headers['x-api-key']);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { data, error } = await supabase
    .from('browsers')
    .select('*')
    .is('closed_at', null)
    .eq('user', user);

  if (error) {
    res.status(500).json({ error });
    return;
  }

  res.status(200).json(data);
}
