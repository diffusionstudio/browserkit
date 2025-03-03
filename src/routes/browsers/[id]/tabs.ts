import { Request, Response } from "express";
import { getUser, supabase } from "../../../lib/supabase";

export async function GET(req: Request, res: Response) {
  const browserId = req.params['id'];
  const user = await getUser(req.headers['x-api-key']);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { data, error } = await supabase
    .from('browser_tabs')
    .select('*, browser(user)')
    .is('closed_at', null)
    .eq('browser.user', user)
    .eq('browser', browserId);

  if (error) {
    res.status(500).json({ error });
    return;
  }

  res.status(200).json(data);
}

