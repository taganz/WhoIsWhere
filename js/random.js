// Pure random-selection logic: doesn't touch the DOM or Supabase.

// Picks a random item from `items`, optionally excluding `excludeId`
// (the last one played in this browser). If none are left after
// excluding it, repeating is allowed.
export function elegirAlAzar(items, excludeId) {
  let candidatos = items;
  if (excludeId != null) {
    const sinExcluido = items.filter((item) => item.id !== excludeId);
    if (sinExcluido.length > 0) candidatos = sinExcluido;
  }

  return candidatos[Math.floor(Math.random() * candidatos.length)];
}
