// Tolerant recognition of the character's name.
// Formula: Levenshtein distance <= max(2, round(0.3 * normalized_text_length)).

const DIACRITICS_REGEX = new RegExp(String.fromCharCode(0x5b) + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + String.fromCharCode(0x5d), 'g');

export function normalize(str) {
  return str
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function threshold(len) {
  return Math.max(2, Math.round(0.3 * len));
}

function candidateStrings(personaje) {
  const nombres = [personaje.nombre, ...(personaje.nombres_alternativos || [])];
  const candidatos = new Set();
  for (const nombre of nombres) {
    const norm = normalize(nombre);
    candidatos.add(norm);
    norm.split(' ').forEach((palabra) => {
      if (palabra.length > 2) candidatos.add(palabra);
    });
  }
  return [...candidatos];
}

export function isNameMatch(inputText, personaje) {
  const input = normalize(inputText);
  if (input.length < 2) return false;

  const t = threshold(input.length);
  for (const candidato of candidateStrings(personaje)) {
    if (candidato === input) return true;
    if (candidato.length > 2 && (candidato.includes(input) || input.includes(candidato))) return true;
    if (levenshtein(input, candidato) <= t) return true;
  }
  return false;
}
