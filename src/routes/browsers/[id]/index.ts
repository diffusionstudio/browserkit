import { Request, Response } from "express";
import { getUser, supabase } from "../../../lib/supabase";

export async function DELETE(req: Request, res: Response) {
  const browserId = req.params['id'];
  const user = await getUser(req.headers['x-api-key']);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { error } = await supabase
    .from('browsers')
    .update({ closed_at: new Date().toISOString() })
    .is('closed_at', null)
    .eq('id', browserId)
    .eq('user', user)
    .single();

  if (error) {
    res.status(500).json({ error });
    return;
  }

  res.status(204).send();
}
