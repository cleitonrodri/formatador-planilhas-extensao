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

const btnRemoverDuplicadas = document.getElementById('btn-remover-duplicadas');
const spanContador = document.getElementById('contador');

// Variável para guardar os dados originais puros (evita perda de dados ao mascarar)
let textoOriginalCache = '';

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
 * Atualiza o contador de linhas e caracteres
 */
function atualizarContador() {
  const texto = entradaTexto.value;
  const caracteres = texto.length;
  // Se estiver vazio é 0, se não, conta quantas quebras de linha existem + 1
  const linhas = texto === '' ? 0 : texto.split('\n').length;
  spanContador.textContent = `Linhas: ${linhas} | Caract.: ${caracteres}`;
}

/**
 * Aplica uma transformação linha por linha
 */
function aplicarTransformacao(funcaoTransformadora, usarCache = false) {
  // Se for uma operação destructiva como máscara, atualiza o cache com o valor atual limpo se necessário,
  // ou usa o cache original para permitir alternar entre máscaras livremente.
  let valorParaProcessar = entradaTexto.value;
  
  if (usarCache) {
    if (!textoOriginalCache && valorParaProcessar) {
      textoOriginalCache = valorParaProcessar; // Guarda o estado original antes do primeiro máscara
    }
    if (textoOriginalCache) {
      valorParaProcessar = textoOriginalCache; // Sempre usa a base original limpa
    }
  }

  if (!valorParaProcessar) return;

  const linhas = valorParaProcessar.split('\n');
  const resultado = linhas.map(linha => funcaoTransformadora(linha)).join('\n');
  entradaTexto.value = resultado;
  atualizarContador();
}

// Conexão dos botões de formatação
btnFormatarCPF.addEventListener('click', () => aplicarTransformacao(formatarCPF));
btnFormatarCNPJ.addEventListener('click', () => aplicarTransformacao(formatarCNPJ));
btnFormatarTelefone.addEventListener('click', () => aplicarTransformacao(formatarTelefone));
btnApenasNumeros.addEventListener('click', () => aplicarTransformacao(apenasNumeros));

// Botão de mascarar usa o cache (usarCache = true) para permitir alternar entre opções livremente
btnMascararCPF.addEventListener('click', () => {
  const modo = seletorModoMascara.value;
  aplicarTransformacao((texto) => mascararCPF(texto, modo), true);
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
    textoOriginalCache = textoTransferencia; // Atualiza o cache com o novo conteúdo colado
    exibirNotificacao('Texto colado!');
  } catch (erro) {
    entradaTexto.focus();
    exibirNotificacao('Permissão necessária ou use Ctrl+V');
  }
});

// Atualiza o cache também se o usuário digitar/colar manualmente na caixa
entradaTexto.addEventListener('input', () => {
  textoOriginalCache = entradaTexto.value;
  atualizarContador();
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

// Botão Remover Linhas Duplicadas
btnRemoverDuplicadas.addEventListener('click', () => {
  if (!entradaTexto.value) return;
  
  const linhas = entradaTexto.value.split('\n');
  // O 'Set' do JavaScript filtra automaticamente valores únicos em uma lista
  const linhasUnicas = [...new Set(linhas)];
  
  entradaTexto.value = linhasUnicas.join('\n');
  textoOriginalCache = entradaTexto.value; // Atualiza o cache para não perder os dados
  atualizarContador();
  exibirNotificacao(`${linhas.length - linhasUnicas.length} duplicatas removidas!`);
});

// Botão Limpar Tudo
btnLimparTudo.addEventListener('click', () => {
  entradaTexto.value = '';
  textoOriginalCache = '';
  atualizarContador();
  entradaTexto.focus();
});