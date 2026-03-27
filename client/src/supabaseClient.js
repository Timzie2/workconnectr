import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://vpmddvbycrexfxonovds.supabase.co"

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbWRkdmJ5Y3JleGZ4b25vdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODE0NTgsImV4cCI6MjA4ODE1NzQ1OH0.btXlOP3D604rTgsAR_q4flGRBaRxj3gde-8KoZU839Y"

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

export default supabase