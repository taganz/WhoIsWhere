import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elegirAlAzar } from './random.js';

// Critical chi-squared values for alpha = 0.001 (a very lenient test:
// it only fails if the deviation from uniformity is huge and unlikely
// by chance, keeping the test from being "flaky").
const CHI2_CRITICO = { 5: 20.515, 9: 27.877 };

function chiCuadradoUniforme(conteos) {
  const total = conteos.reduce((a, b) => a + b, 0);
  const esperado = total / conteos.length;
  return conteos.reduce((acc, c) => acc + (c - esperado) ** 2 / esperado, 0);
}

test('elegirAlAzar distributes choices uniformly among candidates', () => {
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
    `chi2=${chi2.toFixed(2)} too high to be uniform (counts: ${conteos.join(', ')})`
  );
});

test('elegirAlAzar never returns excludeId when other candidates exist', () => {
  const personajes = Array.from({ length: 5 }, (_, i) => ({ id: i }));

  for (let i = 0; i < 2000; i++) {
    const elegido = elegirAlAzar(personajes, 2);
    assert.notEqual(elegido.id, 2);
  }
});

test('elegirAlAzar allows repeating excludeId if it is the only candidate', () => {
  const personajes = [{ id: 1 }];
  const elegido = elegirAlAzar(personajes, 1);
  assert.equal(elegido.id, 1);
});

test('elegirAlAzar without exclusion stays uniform even with many consecutive draws', () => {
  // Checks there's no bias toward the first or last element of the
  // array, a typical mistake when implementing "random" selection by hand.
  const personajes = Array.from({ length: 10 }, (_, i) => ({ id: i }));
  const NUM_TIRADAS = 30000;
  const conteos = new Array(personajes.length).fill(0);

  for (let i = 0; i < NUM_TIRADAS; i++) {
    conteos[elegirAlAzar(personajes, null).id]++;
  }

  const chi2 = chiCuadradoUniforme(conteos);
  assert.ok(
    chi2 < CHI2_CRITICO[personajes.length - 1],
    `chi2=${chi2.toFixed(2)} too high to be uniform (counts: ${conteos.join(', ')})`
  );
});
