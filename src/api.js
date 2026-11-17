import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config.js';

const url = import.meta.env.VITE_SUPABASE_URL || supabaseConfig.url;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || supabaseConfig.publishableKey;
export const database = url && key ? createClient(url, key) : null;

export async function loadCatalog() {
  if (!database) return null;
  const { data, error } = await database.from('products').select('*').eq('active', true).order('name');
  if (error) throw error;
  return data;
}

export async function getProfile(user) {
  if (!database || !user) return null;
  const { data, error } = await database.from('profiles').select('id, role, display_name').eq('id', user.id).single();
  if (error) throw error;
  return data;
}

export function explainError(error) {
  const message = String(error?.message || '');
  if (message.includes('rate limit')) return 'Слишком много запросов. Попробуйте немного позже.';
  if (message.includes('Signups not allowed') || message.includes('User not found')) return 'Аккаунт не найден. Сначала зарегистрируйтесь.';
  if (message.includes('row-level security') || error?.code === '42501') return 'Недостаточно прав для этого действия.';
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) return 'Не удалось связаться с базой. Проверьте подключение.';
  if (message.includes('expired') || message.includes('invalid')) return 'Ссылка устарела или недействительна. Запросите новую.';
  return 'Не удалось выполнить действие. Попробуйте ещё раз.';
}
