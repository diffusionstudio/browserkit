import { supabase } from "./supabase";
import { browsers } from "./browser";

type BrowserUpdate = {
  new: {
    closed_at: string | null;
    id: string;
  },
}

// Create a function to handle inserts
function handleUpdates(payload: BrowserUpdate) {
  if (payload.new.closed_at) {
    browsers.get(payload.new.id)?.close();
  }
}

supabase
  .channel('browsers')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'browsers' }, handleUpdates)
  .subscribe();
