// Lógica pura de selección al azar: no toca el DOM ni Supabase.

// Elige un elemento al azar de `items` excluyendo opcionalmente `excludeId`
// (el último jugado en este navegador). Si tras excluirlo no queda ninguno,
// se permite repetir.
export function elegirAlAzar(items, excludeId) {
  let candidatos = items;
  if (excludeId != null) {
    const sinExcluido = items.filter((item) => item.id !== excludeId);
    if (sinExcluido.length > 0) candidatos = sinExcluido;
  }

  return candidatos[Math.floor(Math.random() * candidatos.length)];
}
