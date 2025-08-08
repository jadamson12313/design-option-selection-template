import { createClient } from 'npm:@supabase/supabase-js@2';

// Get environment variables for KV store
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create KV client
const kvClient = () => createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

// KV Store interface - all functions exported
export const set = async (key: string, value: any): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_0b7c7173").upsert({
    key,
    value
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const get = async (key: string): Promise<any> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_0b7c7173").select("value").eq("key", key).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data?.value;
};

export const del = async (key: string): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_0b7c7173").delete().eq("key", key);
  if (error) {
    throw new Error(error.message);
  }
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_0b7c7173").upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
  if (error) {
    throw new Error(error.message);
  }
};

export const mget = async (keys: string[]): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_0b7c7173").select("value").in("key", keys);
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((d) => d.value) ?? [];
};

export const mdel = async (keys: string[]): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_0b7c7173").delete().in("key", keys);
  if (error) {
    throw new Error(error.message);
  }
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_0b7c7173").select("key, value").like("key", prefix + "%");
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((d) => ({ key: d.key, value: d.value })) ?? [];
};

console.log('📦 KV Store module loaded successfully');