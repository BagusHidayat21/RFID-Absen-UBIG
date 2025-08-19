import { supabase } from "@/utils/supabase/client";

export default async function Instruments() {
  const supabaseClient = supabase;
  const { data: instruments } = await supabaseClient.from("absensi").select();

  return <pre>{JSON.stringify(instruments, null, 2)}</pre>
}
