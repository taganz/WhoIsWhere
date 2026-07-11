import { supabase } from './supabaseClient.js';
import { elegirAlAzar } from './random.js';

// Elige un personaje al azar (con sus hechos ordenados) excluyendo
// opcionalmente el último jugado en este navegador.
export async function fetchRandomPersonaje(excludeId) {
  const { data: personajes, error } = await supabase.from('personajes').select('id, nombre, nombres_alternativos');
  if (error) throw error;
  if (!personajes || personajes.length === 0) throw new Error('No hay personajes disponibles');

  const elegido = elegirAlAzar(personajes, excludeId);

  const { data: hechos, error: errorHechos } = await supabase
    .from('hechos')
    .select('anio, actividad, orden, palabra_clave, ciudades(nombre, lat, lon)')
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
      palabra_clave: h.palabra_clave,
      ciudad: { nombre: h.ciudades.nombre, lat: h.ciudades.lat, lon: h.ciudades.lon },
    })),
  };
}
