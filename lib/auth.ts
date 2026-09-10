import { getServerSupabase } from './supabase/server';
export async function getUser() { const supabase=await getServerSupabase(); const {data:{user}}=await supabase.auth.getUser(); return user; }
export async function requireUser(){ const user=await getUser(); if(!user) throw new Error('UNAUTHORIZED'); return user; }
