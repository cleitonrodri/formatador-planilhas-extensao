/**
 * Módulo de utilitários para formatação e manipulação de textos e documentos
 */

// Extrai apenas os números de qualquer texto
export function apenasNumeros(texto) {
  return String(texto || '').replace(/\D/g, '');
}

// 1. Formata CPF (000.000.000-00)
export function formatarCPF(texto) {
  const digitos = apenasNumeros(texto);
  if (digitos.length !== 11) return texto;
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// 2. Mascara CPF (LGPD) com modos configuráveis
// Modos: 'meio' (123.***.***-00), 'pontas' (***.456.789-**), 'ocultar_tudo' (***.***.***-00)
export function mascararCPF(texto, modo = 'meio') {
  const digitos = apenasNumeros(texto);
  if (digitos.length !== 11) return texto;

  switch (modo) {
    case 'meio':
      return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
    case 'pontas':
      return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.$3-**');
    case 'ocultar_tudo':
      return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.***-$4');
    default:
      return formatarCPF(digitos);
  }
}

// 3. Formata CNPJ (00.000.000/0000-00)
export function formatarCNPJ(texto) {
  const digitos = apenasNumeros(texto);
  if (digitos.length !== 14) return texto;
  return digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// 4. Formata Telefone ou Celular: (XX) XXXX-XXXX ou (XX) 9XXXX-XXXX
export function formatarTelefone(texto) {
  const digitos = apenasNumeros(texto);
  if (digitos.length === 11) {
    return digitos.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digitos.length === 10) {
    return digitos.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return texto;
}

// 5. Converte para MAIÚSCULAS
export function paraMaiusculas(texto) {
  return String(texto || '').toUpperCase();
}

// 6. Converte para minúsculas
export function paraMinusculas(texto) {
  return String(texto || '').toLowerCase();
}

// 7. Primeira letra da frase em maiúscula
export function primeiraLetraMaiuscula(texto) {
  const textoLimpo = String(texto || '').toLowerCase();
  return textoLimpo.charAt(0).toUpperCase() + textoLimpo.slice(1);
}

// 8. Primeira Letra De Cada Palavra (Title Case) ignorando preposições comuns
export function primeiraLetraDeCadaPalavra(texto) {
  const preposicoes = ['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'com', 'por', 'para'];
  return String(texto || '')
    .toLowerCase()
    .split(/\s+/)
    .map((palavra, indice) => {
      if (!palavra) return '';
      if (indice > 0 && preposicoes.includes(palavra)) {
        return palavra;
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
}

// 9. Remove acentos e caracteres diacríticos
export function removerAcentos(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// 10. Remove espaços duplicados e quebras soltas (Trim avançado)
export function limparEspacosExtras(texto) {
  return String(texto || '').replace(/\s+/g, ' ').trim();
}