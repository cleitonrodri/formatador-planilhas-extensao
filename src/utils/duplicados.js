/**
 * Detecção de valores duplicados.
 *
 * A comparação é feita sobre uma "chave" normalizada, para que formatos
 * diferentes do mesmo dado sejam considerados iguais:
 *   - CPF:      123.456.789-00 = 12345678900 = 1234567890 (zero cortado)
 *   - Telefone: (11) 91234-5678 = 11912345678 = +55 11 91234-5678
 *   - E-mail:   Ana@Gmail.com  = ana@gmail.com
 *   - Texto:    "João  Silva"  = "joao silva" (ignora acentos, caixa e espaços)
 */

import {
  apenasNumeros,
  cpfValido,
  limparInvisiveis,
  normalizarDigitosTelefone,
  removerAcentos
} from './formatadores.js';

export const NOMES_TIPO = {
  texto: 'texto',
  cpf: 'CPF',
  telefone: 'telefone',
  email: 'e-mail'
};

const TEM_LETRA = /\p{L}/u;

/**
 * Transforma um valor em uma chave de comparação. Devolve '' para valores
 * vazios (que nunca são considerados duplicados).
 */
export function chaveDe(valor, tipo) {
  const texto = limparInvisiveis(valor).trim();
  if (!texto) return '';

  // Valor mascarado (ex.: ***.***.***-25) esconde dígitos: dois CPFs diferentes
  // podem ter a mesma máscara, então não dá para afirmar que são duplicados.
  if (texto.includes('*')) return '';

  switch (tipo) {
    case 'cpf': {
      const digitos = apenasNumeros(texto);
      if (!digitos) return '';
      return digitos.length >= 9 && digitos.length <= 11 ? digitos.padStart(11, '0') : digitos;
    }
    case 'telefone':
      return normalizarDigitosTelefone(texto);
    case 'email':
      return texto.toLowerCase();
    default:
      return removerAcentos(texto).toLowerCase().replace(/\s+/g, ' ');
  }
}

/**
 * Descobre que tipo de dado a maioria dos valores parece ser.
 * Devolve 'email' | 'cpf' | 'telefone' | 'texto'.
 */
export function detectarTipo(valores) {
  const lista = valores.map((v) => limparInvisiveis(v).trim()).filter(Boolean);
  if (lista.length === 0) return 'texto';

  const maioria = (teste) => lista.filter(teste).length / lista.length >= 0.6;

  if (maioria((v) => /\S+@\S+/.test(v))) return 'email';

  const semLetras = (v) => !TEM_LETRA.test(v);

  if (
    maioria((v) => {
      const d = apenasNumeros(v);
      return semLetras(v) && d.length >= 9 && d.length <= 11 && cpfValido(d.padStart(11, '0'));
    })
  ) {
    return 'cpf';
  }

  if (maioria((v) => semLetras(v) && [10, 11].includes(normalizarDigitosTelefone(v).length))) {
    return 'telefone';
  }

  return 'texto';
}

/**
 * Pega, de cada linha, o valor que será comparado.
 * coluna === null usa a linha inteira; um número usa aquela coluna (separada por TAB).
 */
export function extrairValores(linhas, coluna) {
  return linhas.map((linha) => (coluna === null ? linha : linha.split('\t')[coluna] ?? ''));
}

/**
 * Encontra duplicados em uma lista de valores.
 *
 * Retorna:
 *   porLinha  -> para cada índice: null (não duplicado) ou { grupo, ocorrencia, total }
 *   grupos    -> [{ grupo, chave, linhas: [índices], exemplo }] na ordem em que aparecem
 *   linhasDuplicadas -> quantas linhas participam de algum grupo (todas as ocorrências)
 *   repetidas -> quantas linhas sobrariam se mantivesse só a 1ª de cada grupo (as removíveis)
 */
export function encontrarDuplicados(valores, tipo) {
  const mapa = new Map();
  valores.forEach((valor, indice) => {
    const chave = chaveDe(valor, tipo);
    if (!chave) return;
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave).push(indice);
  });

  const porLinha = new Array(valores.length).fill(null);
  const grupos = [];

  for (const [chave, indices] of mapa) {
    if (indices.length < 2) continue;
    const grupo = grupos.length;
    indices.forEach((indice, posicao) => {
      porLinha[indice] = { grupo, ocorrencia: posicao + 1, total: indices.length };
    });
    grupos.push({ grupo, chave, linhas: indices, exemplo: String(valores[indices[0]]).trim() });
  }

  const linhasDuplicadas = grupos.reduce((soma, g) => soma + g.linhas.length, 0);
  return { porLinha, grupos, linhasDuplicadas, repetidas: linhasDuplicadas - grupos.length };
}
