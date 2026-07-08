import { supabase } from './supabaseClient.js';

// Elige un personaje al azar (con sus hechos ordenados) excluyendo
// opcionalmente el último jugado en este navegador. Si tras excluirlo no
// queda ninguno, se permite repetir.
export async function fetchRandomPersonaje(excludeId) {
  const { data: personajes, error } = await supabase.from('personajes').select('id, nombre, nombres_alternativos');
  if (error) throw error;
  if (!personajes || personajes.length === 0) throw new Error('No hay personajes disponibles');

  let candidatos = personajes;
  if (excludeId != null) {
    const sinExcluido = personajes.filter((p) => p.id !== excludeId);
    if (sinExcluido.length > 0) candidatos = sinExcluido;
  }

  const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];

  const { data: hechos, error: errorHechos } = await supabase
    .from('hechos')
    .select('anio, actividad, orden, ciudades(nombre, lat, lon)')
    .eq('personaje_id', elegido.id)
    .order('orden', { ascending: true })
    .limit(4);
  if (errorHechos) throw errorHechos;
  if (!hechos || hechos.length < 4) {
    throw new Error(`El personaje "${elegido.nombre}" no tiene suficientes hechos (mínimo 4)`);
  }

  return {
    id: elegido.id,
    nombre: elegido.nombre,
    nombres_alternativos: elegido.nombres_alternativos || [],
    hechos: hechos.map((h) => ({
      anio: h.anio,
      actividad: h.actividad,
      ciudad: { nombre: h.ciudades.nombre, lat: h.ciudades.lat, lon: h.ciudades.lon },
    })),
  };
}
