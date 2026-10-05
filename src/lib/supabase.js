// One shared connection to Supabase for the whole app.
// Every page imports `supabase` from here instead of creating its own.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key || url.includes('YOUR-PROJECT-ID')) {
  // Fail loudly so a missing .env is obvious instead of a confusing network error.
  throw new Error('Supabase settings missing: fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env')
}

export const supabase = createClient(url, key)
