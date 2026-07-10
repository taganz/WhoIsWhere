import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elegirAlAzar } from './random.js';

// Valores críticos de chi-cuadrado para alpha = 0.001 (test muy tolerante:
// solo falla si la desviación de la uniformidad es enorme e improbable por
// azar, evitando que el test sea "flaky").
const CHI2_CRITICO = { 5: 20.515, 9: 27.877 };

function chiCuadradoUniforme(conteos) {
  const total = conteos.reduce((a, b) => a + b, 0);
  const esperado = total / conteos.length;
  return conteos.reduce((acc, c) => acc + (c - esperado) ** 2 / esperado, 0);
}

test('elegirAlAzar distribuye las elecciones de forma uniforme entre los candidatos', () => {
  const personajes = Array.from({ length: 6 }, (_, i) => ({ id: i }));
  const NUM_TIRADAS = 30000;
  const conteos = new Array(personajes.length).fill(0);

  for (let i = 0; i < NUM_TIRADAS; i++) {
    const elegido = elegirAlAzar(personajes, null);
    conteos[elegido.id]++;
  }

  const chi2 = chiCuadradoUniforme(conteos);
  assert.ok(
    chi2 < CHI2_CRITICO[personajes.length - 1],
    `chi2=${chi2.toFixed(2)} demasiado alto para ser uniforme (conteos: ${conteos.join(', ')})`
  );
});

test('elegirAlAzar nunca devuelve excludeId cuando hay otros candidatos', () => {
  const personajes = Array.from({ length: 5 }, (_, i) => ({ id: i }));

  for (let i = 0; i < 2000; i++) {
    const elegido = elegirAlAzar(personajes, 2);
    assert.notEqual(elegido.id, 2);
  }
});

test('elegirAlAzar permite repetir excludeId si es el único candidato', () => {
  const personajes = [{ id: 1 }];
  const elegido = elegirAlAzar(personajes, 1);
  assert.equal(elegido.id, 1);
});

test('elegirAlAzar sin exclusión sigue siendo uniforme incluso con muchas repeticiones seguidas', () => {
  // Comprueba que no hay sesgo hacia el primer o el último elemento del
  // array, un error típico al implementar selección "al azar" a mano.
  const personajes = Array.from({ length: 10 }, (_, i) => ({ id: i }));
  const NUM_TIRADAS = 30000;
  const conteos = new Array(personajes.length).fill(0);

  for (let i = 0; i < NUM_TIRADAS; i++) {
    conteos[elegirAlAzar(personajes, null).id]++;
  }

  const chi2 = chiCuadradoUniforme(conteos);
  assert.ok(
    chi2 < CHI2_CRITICO[personajes.length - 1],
    `chi2=${chi2.toFixed(2)} demasiado alto para ser uniforme (conteos: ${conteos.join(', ')})`
  );
});
