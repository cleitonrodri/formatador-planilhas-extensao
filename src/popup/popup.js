import {
  formatarCPF,
  mascararCPF,
  formatarCNPJ,
  formatarTelefone,
  apenasNumeros,
  paraMaiusculas,
  paraMinusculas,
  primeiraLetraMaiuscula,
  primeiraLetraDeCadaPalavra,
  removerAcentos,
  limparEspacosExtras
} from '../utils/formatadores.js';

// Elementos da interface
const entradaTexto = document.getElementById('entrada-texto');
const seletorModoMascara = document.getElementById('seletor-modo-mascara');
const alertaNotificacao = document.getElementById('alerta-notificacao');

// Botões
const btnColar = document.getElementById('btn-colar');
const btnLimparTudo = document.getElementById('btn-limpar-tudo');
const btnCopiar = document.getElementById('btn-copiar');

const btnFormatarCPF = document.getElementById('btn-formatar-cpf');
const btnMascararCPF = document.getElementById('btn-mascarar-cpf');
const btnFormatarCNPJ = document.getElementById('btn-formatar-cnpj');
const btnFormatarTelefone = document.getElementById('btn-formatar-telefone');
const btnApenasNumeros = document.getElementById('btn-apenas-numeros');

const btnMaiusculas = document.getElementById('btn-maiusculas');
const btnMinusculas = document.getElementById('btn-minusculas');
const btnPrimeiraMaiuscula = document.getElementById('btn-primeira-maiuscula');
const btnTitulo = document.getElementById('btn-titulo');
const btnRemoverAcentos = document.getElementById('btn-remover-acentos');
const btnLimparEspacos = document.getElementById('btn-limpar-espacos');

/**
 * Exibe notificação temporária
 */
function exibirNotificacao(mensagem) {
  alertaNotificacao.textContent = mensagem;
  alertaNotificacao.classList.remove('oculto');
  setTimeout(() => {
    alertaNotificacao.classList.add('oculto');
  }, 2000);
}

/**
 * Aplica uma transformação linha por linha no texto (útil para dados de planilhas)
 */
function aplicarTransformacao(funcaoTransformadora) {
  const valorAtual = entradaTexto.value;
  if (!valorAtual) return;

  const linhas = valorAtual.split('\n');
  const resultado = linhas.map(linha => funcaoTransformadora(linha)).join('\n');
  entradaTexto.value = resultado;
}

// Conexão dos botões de formatação
btnFormatarCPF.addEventListener('click', () => aplicarTransformacao(formatarCPF));
btnFormatarCNPJ.addEventListener('click', () => aplicarTransformacao(formatarCNPJ));
btnFormatarTelefone.addEventListener('click', () => aplicarTransformacao(formatarTelefone));
btnApenasNumeros.addEventListener('click', () => aplicarTransformacao(apenasNumeros));

btnMascararCPF.addEventListener('click', () => {
  const modo = seletorModoMascara.value;
  aplicarTransformacao((texto) => mascararCPF(texto, modo));
});

btnMaiusculas.addEventListener('click', () => aplicarTransformacao(paraMaiusculas));
btnMinusculas.addEventListener('click', () => aplicarTransformacao(paraMinusculas));
btnPrimeiraMaiuscula.addEventListener('click', () => aplicarTransformacao(primeiraLetraMaiuscula));
btnTitulo.addEventListener('click', () => aplicarTransformacao(primeiraLetraDeCadaPalavra));
btnRemoverAcentos.addEventListener('click', () => aplicarTransformacao(removerAcentos));
btnLimparEspacos.addEventListener('click', () => aplicarTransformacao(limparEspacosExtras));

// Botão Colar da Área de Transferência
btnColar.addEventListener('click', async () => {
  try {
    const textoTransferencia = await navigator.clipboard.readText();
    entradaTexto.value = textoTransferencia;
    exibirNotificacao('Texto colado!');
  } catch (erro) {
    entradaTexto.focus();
    exibirNotificacao('Permissão necessária ou use Ctrl+V');
  }
});

// Botão Copiar Resultado
btnCopiar.addEventListener('click', async () => {
  if (!entradaTexto.value) return;
  try {
    await navigator.clipboard.writeText(entradaTexto.value);
    exibirNotificacao('Copiado para a área de transferência!');
  } catch (erro) {
    entradaTexto.select();
    document.execCommand('copy');
    exibirNotificacao('Copiado!');
  }
});

// Botão Limpar Tudo
btnLimparTudo.addEventListener('click', () => {
  entradaTexto.value = '';
  entradaTexto.focus();
});