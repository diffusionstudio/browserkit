import { supabase } from "./lib/supabase";

// Subscribe to updates on the "messages" table
supabase
  .channel('browsers_updates')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'browsers' },
    (payload) => {
      console.log('Update detected:', payload);
    }
  )
  .subscribe();
