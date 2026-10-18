/**
 * Módulo de utilitários para formatação e manipulação de textos e documentos.
 *
 * Convenção de retorno:
 *  - Funções de DOCUMENTO (CPF, telefone) devolvem { valor, problema }:
 *      valor    -> texto resultante (igual ao original quando não foi possível formatar)
 *      problema -> null quando está tudo certo, ou uma mensagem curta em português
 *  - Funções de TEXTO devolvem apenas a string resultante.
 *
 * Regra de ouro dos documentos: nunca inventar dígitos. Zeros à esquerda só são
 * restaurados quando o resultado passa na validação dos dígitos verificadores.
 */

// Caracteres invisíveis comuns em textos copiados de formulários e páginas web
const INVISIVEIS = /[​-‍⁠﻿]/g;

// Números que a planilha transformou em notação científica (ex.: 1,23457E+10)
const NOTACAO_CIENTIFICA = /^[+-]?\d+(?:[.,]\d+)?e[+-]?\d+$/i;

const TEM_LETRA = /\p{L}/u;

// DDDs existentes no Brasil
const DDDS_VALIDOS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99'
]);

// ---------------------------------------------------------------------------
// Utilitários básicos
// ---------------------------------------------------------------------------

// Extrai apenas os números de qualquer texto
export function apenasNumeros(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

// Remove caracteres invisíveis (largura zero, BOM)
export function limparInvisiveis(texto) {
  return String(texto ?? '').replace(INVISIVEIS, '');
}

// ---------------------------------------------------------------------------
// CPF
// ---------------------------------------------------------------------------

// Confere os dois dígitos verificadores de um CPF com 11 dígitos
export function cpfValido(digitos) {
  if (!/^\d{11}$/.test(digitos)) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false; // 111.111.111-11 etc.

  const calcular = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (base.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return (
    calcular(digitos.slice(0, 9)) === Number(digitos[9]) &&
    calcular(digitos.slice(0, 10)) === Number(digitos[10])
  );
}

/**
 * Lê um CPF "sujo" e decide o que dá para fazer com ele.
 * Devolve { vazio } | { erro } | { digitos, valido, zerosRestaurados }
 *
 * - 11 dígitos: usa como está (valido diz se os dígitos verificadores conferem).
 * - 9 ou 10 dígitos: só completa com zeros se o CPF resultante for válido.
 * - menos de 9, mais de 11, letras, notação científica ou máscara: erro.
 */
function lerCPF(texto) {
  const bruto = limparInvisiveis(texto).trim();
  if (!bruto) return { vazio: true };

  if (NOTACAO_CIENTIFICA.test(bruto)) {
    return { erro: 'Número em notação científica (a planilha cortou os dígitos)' };
  }
  if (bruto.includes('*')) return { erro: 'CPF já está mascarado' };
  if (TEM_LETRA.test(bruto)) return { erro: 'Contém letras' };

  const digitos = apenasNumeros(bruto);
  if (!digitos) return { erro: 'Não tem números' };
  if (digitos.length > 11) return { erro: `Tem ${digitos.length} dígitos (CPF tem 11)` };
  if (digitos.length < 9) return { erro: `Faltam dígitos (tem ${digitos.length}, CPF tem 11)` };

  if (digitos.length === 11) {
    return { digitos, valido: cpfValido(digitos), zerosRestaurados: false };
  }

  const completo = digitos.padStart(11, '0');
  if (cpfValido(completo)) {
    return { digitos: completo, valido: true, zerosRestaurados: true };
  }
  return { erro: `Tem ${digitos.length} dígitos e completar com zeros não gera um CPF válido` };
}

const MSG_CPF_INVALIDO = 'CPF inválido (dígitos verificadores não conferem)';

// 1. Formata CPF (000.000.000-00)
export function formatarCPF(texto) {
  const original = String(texto ?? '');
  const leitura = lerCPF(original);
  if (leitura.vazio) return { valor: original, problema: null };
  if (leitura.erro) return { valor: original, problema: leitura.erro };

  return {
    valor: leitura.digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    problema: leitura.valido ? null : MSG_CPF_INVALIDO
  };
}

// 2. Mascara CPF (LGPD)
// Modos: 'meio' (123.***.***-00), 'pontas' (***.456.789-**), 'so_final' (***.***.***-00)
export function mascararCPF(texto, modo = 'meio') {
  const original = String(texto ?? '');
  const leitura = lerCPF(original);
  if (leitura.vazio) return { valor: original, problema: null };
  if (leitura.erro) return { valor: original, problema: leitura.erro };

  const partes = /^(\d{3})(\d{3})(\d{3})(\d{2})$/.exec(leitura.digitos);
  let valor;
  switch (modo) {
    case 'pontas':
      valor = `***.${partes[2]}.${partes[3]}-**`;
      break;
    case 'so_final':
      valor = `***.***.***-${partes[4]}`;
      break;
    case 'meio':
    default:
      valor = `${partes[1]}.***.***-${partes[4]}`;
  }
  return { valor, problema: leitura.valido ? null : MSG_CPF_INVALIDO };
}

// ---------------------------------------------------------------------------
// Telefone
// ---------------------------------------------------------------------------

/**
 * Devolve só os dígitos do telefone, sem o +55 e sem o 0 antes do DDD.
 * Não valida nada; serve para formatar e para comparar telefones.
 */
export function normalizarDigitosTelefone(texto) {
  let digitos = apenasNumeros(limparInvisiveis(texto));
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }
  if ((digitos.length === 11 || digitos.length === 12) && digitos.startsWith('0')) {
    digitos = digitos.slice(1);
  }
  return digitos;
}

// 3. Formata Telefone ou Celular: (XX) XXXX-XXXX ou (XX) 9XXXX-XXXX
export function formatarTelefone(texto) {
  const original = String(texto ?? '');
  const bruto = limparInvisiveis(original).trim();
  if (!bruto) return { valor: original, problema: null };

  const falha = (problema) => ({ valor: original, problema });

  if (NOTACAO_CIENTIFICA.test(bruto)) {
    return falha('Número em notação científica (a planilha cortou os dígitos)');
  }
  if (TEM_LETRA.test(bruto)) return falha('Contém letras');

  const todosDigitos = apenasNumeros(bruto);
  if (!todosDigitos) return falha('Não tem números');
  if (/^(0800|0300)/.test(todosDigitos)) return falha('Número 0800/0300 (não é telefone comum)');
  if (bruto.startsWith('+') && !todosDigitos.startsWith('55')) {
    return falha('Número de outro país (só +55 é formatado)');
  }

  const digitos = normalizarDigitosTelefone(bruto);

  if (digitos.length === 10 || digitos.length === 11) {
    const ddd = digitos.slice(0, 2);
    const local = digitos.slice(2);
    const celular = digitos.length === 11;

    let problema = null;
    if (!DDDS_VALIDOS.has(ddd)) {
      problema = `DDD ${ddd} não existe`;
    } else if (celular && local[0] !== '9') {
      problema = 'Celular com 11 dígitos deve começar com 9 depois do DDD';
    } else if (!celular && /^[6-9]/.test(local)) {
      problema = 'Parece celular sem o 9 inicial (conferir)';
    }

    const valor = celular
      ? `(${ddd}) ${local.slice(0, 5)}-${local.slice(5)}`
      : `(${ddd}) ${local.slice(0, 4)}-${local.slice(4)}`;
    return { valor, problema };
  }

  if (digitos.length === 8 || digitos.length === 9) return falha('Sem DDD');
  return falha(`Quantidade de dígitos inválida (${digitos.length})`);
}

// ---------------------------------------------------------------------------
// E-mail
// ---------------------------------------------------------------------------

// Erros de digitação comuns em domínios (só avisamos; nunca corrigimos sozinhos)
const DOMINIOS_PARECIDOS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.com.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com'
};

// 4. Padroniza e-mail: tira espaços e caracteres invisíveis, põe em minúsculas
// e confere o formato. Nunca troca letras do endereço.
export function formatarEmail(texto) {
  const original = String(texto ?? '');
  const bruto = limparInvisiveis(original).trim();
  if (!bruto) return { valor: original, problema: null };

  const falha = (problema) => ({ valor: original, problema });

  // Remove "mailto:", <colchetes> e pontuação solta no fim ("ana@x.com.")
  let email = bruto
    .replace(/^mailto:/i, '')
    .replace(/^<|>$/g, '')
    .replace(/[.,;:]+$/, '');

  if ((email.match(/@/g) || []).length > 1) {
    return falha('Tem mais de um @ (mais de um e-mail na mesma célula?)');
  }

  // Espaços só são aceitos ao redor do @ ("ana @gmail.com"); no meio do texto não
  email = email.replace(/\s*@\s*/, '@');
  if (/\s/.test(email)) return falha('Tem espaço no meio do e-mail');

  email = email.toLowerCase();

  if (!email.includes('@')) return falha('Falta o @');
  const [local, dominio] = email.split('@');
  if (!local) return falha('Falta o texto antes do @');
  if (!dominio) return falha('Falta o domínio depois do @ (ex.: gmail.com)');
  if (/[^\x00-\x7F]/.test(email)) return falha('Tem acento ou caractere especial');

  if (!/^[a-z0-9._%+'-]+$/.test(local) || /^\.|\.$|\.\./.test(local)) {
    return falha('Texto antes do @ inválido');
  }
  if (!dominio.includes('.')) return falha('Domínio incompleto (ex.: gmail.com)');
  if (
    !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dominio) ||
    /\.\.|(^|\.)-|-(\.|$)/.test(dominio)
  ) {
    return falha('Domínio inválido');
  }

  const sugestao = DOMINIOS_PARECIDOS[dominio];
  if (sugestao) {
    return { valor: email, problema: `Domínio parece errado: ${dominio} (seria ${sugestao}?)` };
  }
  return { valor: email, problema: null };
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

// 4. Converte para MAIÚSCULAS
export function paraMaiusculas(texto) {
  return String(texto ?? '').toUpperCase();
}

// 5. Converte para minúsculas
export function paraMinusculas(texto) {
  return String(texto ?? '').toLowerCase();
}

// 6. Primeira letra da frase em maiúscula (o resto fica em minúsculas)
export function primeiraLetraMaiuscula(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .replace(/^([^\p{L}\p{N}]*)(\p{L})/u, (_, antes, letra) => antes + letra.toUpperCase());
}

const PREPOSICOES = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'com', 'por', 'para']);
const ROMANOS = new Set([
  'ii', 'iii', 'iv', 'vi', 'vii', 'viii', 'ix', 'xi', 'xii', 'xiii',
  'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'
]);

// Maiúscula no início da palavra e depois de apóstrofo (d'ávila -> D'Ávila)
function capitalizarPalavra(palavra) {
  return palavra.replace(/(^|['’])(\p{L})/gu, (_, antes, letra) => antes + letra.toUpperCase());
}

// 7. Primeira Letra De Cada Palavra (nomes): preposições ficam em minúsculas,
// hífen e apóstrofo são tratados, e numeral romano no fim fica em maiúsculas
// (Maria da Silva, Ana-Clara D'Ávila, Pedro II)
export function primeiraLetraDeCadaPalavra(texto) {
  const palavras = limparInvisiveis(texto)
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return palavras
    .map((palavra, indice) => {
      if (indice > 0 && PREPOSICOES.has(palavra)) return palavra;
      if (indice > 0 && indice === palavras.length - 1 && ROMANOS.has(palavra)) {
        return palavra.toUpperCase();
      }
      return palavra.split('-').map(capitalizarPalavra).join('-');
    })
    .join(' ');
}

// 8. Remove acentos e caracteres diacríticos
export function removerAcentos(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// 9. Remove espaços duplicados, quebras soltas e caracteres invisíveis
export function limparEspacosExtras(texto) {
  return limparInvisiveis(texto).replace(/\s+/g, ' ').trim();
}
