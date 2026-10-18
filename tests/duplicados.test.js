import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chaveDe,
  detectarTipo,
  extrairValores,
  encontrarDuplicados
} from '../src/utils/duplicados.js';

test('chaveDe: formatos diferentes do mesmo dado geram a mesma chave', () => {
  assert.equal(chaveDe('529.982.247-25', 'cpf'), chaveDe('52998224725', 'cpf'));
  assert.equal(chaveDe('1234567890', 'cpf'), chaveDe('012.345.678-90', 'cpf'));
  assert.equal(chaveDe('(11) 91234-5678', 'telefone'), chaveDe('+55 11 912345678', 'telefone'));
  assert.equal(chaveDe(' Ana@Gmail.COM ', 'email'), 'ana@gmail.com');
  assert.equal(chaveDe('  João   da  SILVA ', 'texto'), chaveDe('joao da silva', 'texto'));
});

test('chaveDe: valores vazios não geram chave', () => {
  for (const tipo of ['texto', 'cpf', 'telefone', 'email']) {
    assert.equal(chaveDe('', tipo), '');
    assert.equal(chaveDe('  ​ ', tipo), '');
  }
  assert.equal(chaveDe('sem números', 'cpf'), '');
});

test('valores mascarados nunca contam como duplicados (a máscara esconde dígitos)', () => {
  // dois CPFs diferentes que terminam em -25 ficam iguais depois de mascarados
  const mascarados = ['***.***.***-25', '***.***.***-25', '529.***.***-25', '529.***.***-25'];
  for (const tipo of ['texto', 'cpf']) {
    assert.equal(chaveDe(mascarados[0], tipo), '');
    const r = encontrarDuplicados(mascarados, tipo);
    assert.equal(r.grupos.length, 0);
    assert.equal(r.linhasDuplicadas, 0);
  }
});

test('detectarTipo', () => {
  assert.equal(detectarTipo(['a@b.com', 'c@d.org', 'sem email']), 'email');
  assert.equal(detectarTipo(['529.982.247-25', '11144477735', '012.345.678-90']), 'cpf');
  assert.equal(detectarTipo(['(11) 91234-5678', '11 3333-4444', '+55 21 98888-7777']), 'telefone');
  assert.equal(detectarTipo(['Maria', 'João', 'Ana']), 'texto');
  assert.equal(detectarTipo([]), 'texto');
  assert.equal(detectarTipo(['', '  ']), 'texto');
});

test('extrairValores: linha inteira ou uma coluna', () => {
  const linhas = ['a\tb\tc', 'd\te', 'f'];
  assert.deepEqual(extrairValores(linhas, null), linhas);
  assert.deepEqual(extrairValores(linhas, 1), ['b', 'e', '']);
  assert.deepEqual(extrairValores(linhas, 2), ['c', '', '']);
});

test('encontrarDuplicados: grupos, ocorrências e contagens', () => {
  const valores = ['529.982.247-25', '111.444.777-35', '52998224725', '', '', '529 982 247 25', 'outro'];
  const r = encontrarDuplicados(valores, 'cpf');

  assert.equal(r.grupos.length, 1);
  assert.deepEqual(r.grupos[0].linhas, [0, 2, 5]);
  assert.equal(r.linhasDuplicadas, 3);
  assert.equal(r.repetidas, 2);
  assert.deepEqual(r.porLinha[0], { grupo: 0, ocorrencia: 1, total: 3 });
  assert.deepEqual(r.porLinha[5], { grupo: 0, ocorrencia: 3, total: 3 });
  assert.equal(r.porLinha[1], null);
  assert.equal(r.porLinha[3], null); // linhas vazias nunca são duplicadas
});

test('encontrarDuplicados: vários grupos na ordem em que aparecem', () => {
  const r = encontrarDuplicados(['Ana', 'bia', 'ana', 'BIA', 'Caio'], 'texto');
  assert.equal(r.grupos.length, 2);
  assert.equal(r.grupos[0].exemplo, 'Ana');
  assert.deepEqual(r.grupos[1].linhas, [1, 3]);
  assert.equal(r.repetidas, 2);
});

test('encontrarDuplicados: sem duplicados', () => {
  const r = encontrarDuplicados(['a', 'b', 'c'], 'texto');
  assert.equal(r.grupos.length, 0);
  assert.equal(r.linhasDuplicadas, 0);
  assert.equal(r.repetidas, 0);
});
