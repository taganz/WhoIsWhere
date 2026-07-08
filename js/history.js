import { supabase } from './supabaseClient.js';

export async function fetchHistorial() {
  const { data, error } = await supabase
    .from('partidas')
    .select('id, alias, puntos, acertado, fecha, personajes(nombre)')
    .order('fecha', { ascending: false })
    .limit(20);
  if (error) throw error;

  return (data || []).map((p) => ({
    id: p.id,
    alias: p.alias,
    personajeNombre: p.personajes ? p.personajes.nombre : '',
    puntos: p.puntos,
    acertado: p.acertado,
    fecha: p.fecha,
  }));
}
