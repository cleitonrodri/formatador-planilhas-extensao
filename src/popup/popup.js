import {
  formatarCPF,
  mascararCPF,
  formatarTelefone,
  formatarEmail,
  apenasNumeros,
  paraMaiusculas,
  paraMinusculas,
  primeiraLetraMaiuscula,
  primeiraLetraDeCadaPalavra,
  removerAcentos,
  limparEspacosExtras
} from '../utils/formatadores.js';
import {
  NOMES_TIPO,
  detectarTipo,
  encontrarDuplicados,
  extrairValores
} from '../utils/duplicados.js';

// ---------------------------------------------------------------------------
// Elementos da interface
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);

const entradaTexto = $('entrada-texto');
const editor = $('editor');
const calha = $('calha');
const calhaConteudo = $('calha-conteudo');
const realce = $('realce');
const realceConteudo = $('realce-conteudo');
const linhaColuna = $('linha-coluna');
const seletorColuna = $('seletor-coluna');
const seletorModoMascara = $('seletor-modo-mascara');
const seletorTipoDuplicado = $('seletor-tipo-duplicado');
const alertaNotificacao = $('alerta-notificacao');
const spanContador = $('contador');

const relatorio = $('relatorio');
const resumoAcaoEl = $('resumo-acao');
const resumoDuplicadosEl = $('resumo-duplicados');
const detProblemas = $('det-problemas');
const sumProblemas = $('sum-problemas');
const listaProblemas = $('lista-problemas');
const detDuplicados = $('det-duplicados');
const sumDuplicados = $('sum-duplicados');
const listaDuplicados = $('lista-duplicados');

const btnColar = $('btn-colar');
const btnDesfazer = $('btn-desfazer');
const btnRefazer = $('btn-refazer');
const btnLimparTudo = $('btn-limpar-tudo');
const btnCopiar = $('btn-copiar');
const btnRemoverDuplicadas = $('btn-remover-duplicadas');

// ---------------------------------------------------------------------------
// Constantes e estado
// ---------------------------------------------------------------------------
const ALTURA_LINHA = 18;       // precisa ser igual a --altura-linha no CSS
const LIMITE_HISTORICO = 50;
const LIMITE_LISTA = 100;
const MAX_COLUNAS = 30;
const CORES_GRUPO = 6;         // precisa ser igual à quantidade de .g0, .g1... no CSS

// Histórico de textos para Desfazer / Refazer
let historico = [''];
let posicao = 0;
let timerSnapshot = null;
let ultimaAcao = null;         // 'mascara' permite trocar de modo de máscara sem perder o original

// Resultado da última ação e problemas encontrados nela
let resumoAcao = null;         // { nome, prontos, alterados, conferir, mensagem }
let problemas = [];            // [{ linha, coluna, mensagem, texto }] (texto = conteúdo da linha na hora)

// Estado calculado a cada renderização
let duplicados = encontrarDuplicados([], 'texto');
let contexto = { coluna: null, tipo: 'texto', automatico: true, valores: [] };

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plural(quantidade, singular, pluralTexto) {
  return quantidade === 1 ? singular : pluralTexto;
}

function listarLinhas(indices) {
  const numeros = indices.map((i) => i + 1);
  if (numeros.length > 8) return `${numeros.slice(0, 8).join(', ')}… (${numeros.length})`;
  if (numeros.length <= 2) return numeros.join(' e ');
  return `${numeros.slice(0, -1).join(', ')} e ${numeros[numeros.length - 1]}`;
}

function resumirTexto(texto, limite = 36) {
  return texto.length > limite ? `${texto.slice(0, limite)}…` : texto;
}

let timerAlerta = null;
function exibirNotificacao(mensagem, duracao = 2000) {
  alertaNotificacao.textContent = mensagem;
  alertaNotificacao.classList.remove('oculto');
  clearTimeout(timerAlerta);
  timerAlerta = setTimeout(() => alertaNotificacao.classList.add('oculto'), duracao);
}

// ---------------------------------------------------------------------------
// Colunas (texto copiado de várias colunas da planilha vem separado por TAB)
// ---------------------------------------------------------------------------
function contarColunas(linhas) {
  return linhas.reduce((maior, linha) => Math.max(maior, linha.split('\t').length), 1);
}

function colunaSelecionada() {
  return seletorColuna.value === 'todas' ? null : Number(seletorColuna.value);
}

function atualizarSeletorColuna(linhas) {
  const colunas = Math.min(contarColunas(linhas), MAX_COLUNAS);

  if (colunas <= 1) {
    linhaColuna.classList.add('oculto');
    if (seletorColuna.options.length !== 1) {
      seletorColuna.innerHTML = '<option value="todas">Todas</option>';
    }
    return;
  }

  linhaColuna.classList.remove('oculto');
  if (seletorColuna.options.length !== colunas + 1) {
    const atual = seletorColuna.value;
    const opcoes = ['<option value="todas">Todas as colunas</option>'];
    for (let j = 0; j < colunas; j++) opcoes.push(`<option value="${j}">Coluna ${j + 1}</option>`);
    seletorColuna.innerHTML = opcoes.join('');
    const aindaExiste = [...seletorColuna.options].some((o) => o.value === atual);
    seletorColuna.value = aindaExiste ? atual : 'todas';
  }
}

function pedirColuna() {
  exibirNotificacao('O texto tem várias colunas: escolha a coluna no campo "Coluna" acima', 3500);
  linhaColuna.classList.add('chamar-atencao');
  seletorColuna.focus();
  setTimeout(() => linhaColuna.classList.remove('chamar-atencao'), 2500);
}

// ---------------------------------------------------------------------------
// Histórico (Desfazer / Refazer)
// ---------------------------------------------------------------------------
function empilhar(valor) {
  historico.length = posicao + 1;   // quem desfez e depois mudou algo perde o "refazer"
  historico.push(valor);
  posicao += 1;
  if (historico.length > LIMITE_HISTORICO) {
    historico.shift();
    posicao -= 1;
  }
}

// Grava no histórico o que foi digitado/colado e ainda não virou um ponto de retorno
function confirmarSnapshot() {
  clearTimeout(timerSnapshot);
  if (entradaTexto.value !== historico[posicao]) empilhar(entradaTexto.value);
}

function aplicarEstadoDoHistorico() {
  entradaTexto.value = historico[posicao];
  ultimaAcao = null;
  resumoAcao = null;
  renderizar();
}

function desfazer() {
  confirmarSnapshot();
  if (posicao === 0) return;
  posicao -= 1;
  aplicarEstadoDoHistorico();
}

function refazer() {
  confirmarSnapshot();
  if (posicao >= historico.length - 1) return;
  posicao += 1;
  aplicarEstadoDoHistorico();
}

function atualizarBotoesHistorico() {
  const pendente = entradaTexto.value !== historico[posicao];
  btnDesfazer.disabled = posicao === 0 && !pendente;
  btnRefazer.disabled = pendente || posicao >= historico.length - 1;
}

// ---------------------------------------------------------------------------
// Desenho do editor (calha numerada + linhas coloridas)
// ---------------------------------------------------------------------------
function sincronizarRolagem() {
  realce.scrollTop = entradaTexto.scrollTop;
  realce.scrollLeft = entradaTexto.scrollLeft;
  calha.scrollTop = entradaTexto.scrollTop;
}

function desenharEditor(linhas, marcasProblema) {
  const digitos = String(linhas.length).length;
  editor.style.setProperty('--largura-calha', `${Math.max(34, digitos * 7 + 20)}px`);

  let htmlRealce = '';
  let htmlCalha = '';

  linhas.forEach((linha, i) => {
    const dup = duplicados.porLinha[i];
    const mensagens = marcasProblema.get(i);

    const classes = [];
    if (dup) classes.push('dup', `g${dup.grupo % CORES_GRUPO}`);
    if (mensagens) classes.push('prob');

    const dicas = [];
    if (dup) dicas.push(`Duplicado: ocorrência ${dup.ocorrencia} de ${dup.total}`);
    if (mensagens) dicas.push(...mensagens);
    const titulo = dicas.length ? ` title="${escapar(dicas.join(' • '))}"` : '';

    const cls = classes.join(' ');
    htmlRealce += `<div class="rl ${cls}">${escapar(linha) || '&nbsp;'}</div>`;
    htmlCalha += `<div class="cl ${cls}"${titulo}>${i + 1}</div>`;
  });

  realceConteudo.innerHTML = htmlRealce;
  calhaConteudo.innerHTML = htmlCalha;
  sincronizarRolagem();
}

function atualizarContador() {
  const texto = entradaTexto.value;
  const linhas = texto === '' ? 0 : texto.split('\n').length;
  spanContador.textContent = `Linhas: ${linhas} | Caract.: ${texto.length}`;
}

// ---------------------------------------------------------------------------
// Relatório (resultado da ação, problemas e duplicados)
// ---------------------------------------------------------------------------
function desenharRelatorio(problemasAtuais, nColunas) {
  // 1. Resultado da última ação
  if (resumoAcao) {
    const partes = [];
    if (resumoAcao.mensagem) {
      partes.push(`<span class="ok">✔ ${escapar(resumoAcao.mensagem)}</span>`);
    } else {
      if (resumoAcao.prontos > 0) {
        const alterados = resumoAcao.alterados
          ? ` (${resumoAcao.alterados} ${plural(resumoAcao.alterados, 'alterado', 'alterados')})`
          : '';
        partes.push(
          `<span class="ok">✔ ${resumoAcao.prontos} ${plural(resumoAcao.prontos, 'pronto', 'prontos')}${alterados}</span>`
        );
      }
      if (resumoAcao.conferir > 0) {
        partes.push(`<span class="aviso">⚠ ${resumoAcao.conferir} para conferir</span>`);
      }
    }
    resumoAcaoEl.innerHTML = `<strong>${escapar(resumoAcao.nome)}:</strong> ${partes.join(' · ')}`;
    resumoAcaoEl.classList.remove('oculto');
  } else {
    resumoAcaoEl.classList.add('oculto');
  }

  // 2. Resumo dos duplicados
  const comValor = contexto.valores.filter((v) => v.trim() !== '').length;
  const nomeTipo = `${NOMES_TIPO[contexto.tipo]}${contexto.automatico ? ' (automático)' : ''}`;
  if (duplicados.grupos.length > 0) {
    const n = duplicados.linhasDuplicadas;
    const g = duplicados.grupos.length;
    resumoDuplicadosEl.innerHTML =
      `<span class="aviso">⧉ ${n} linhas duplicadas</span> em ${g} ${plural(g, 'valor repetido', 'valores repetidos')}` +
      ` · comparando como ${escapar(nomeTipo)}`;
    resumoDuplicadosEl.classList.remove('oculto');
  } else if (comValor >= 2) {
    resumoDuplicadosEl.innerHTML =
      `<span class="ok">✔ Sem duplicados</span> · comparando como ${escapar(nomeTipo)}`;
    resumoDuplicadosEl.classList.remove('oculto');
  } else {
    resumoDuplicadosEl.classList.add('oculto');
  }

  // 3. Lista de problemas (clicar leva até a linha)
  if (problemasAtuais.length > 0) {
    sumProblemas.textContent = `⚠ ${problemasAtuais.length} ${plural(problemasAtuais.length, 'item para conferir', 'itens para conferir')}`;
    listaProblemas.innerHTML =
      problemasAtuais
        .slice(0, LIMITE_LISTA)
        .map((p) => {
          const onde = `Linha ${p.linha + 1}${nColunas > 1 ? `, coluna ${p.coluna + 1}` : ''}`;
          return `<li><button type="button" class="link-linha" data-linha="${p.linha}" data-coluna="${nColunas > 1 ? p.coluna : ''}">${onde}</button> — ${escapar(p.mensagem)}</li>`;
        })
        .join('') +
      (problemasAtuais.length > LIMITE_LISTA
        ? `<li>…e mais ${problemasAtuais.length - LIMITE_LISTA}</li>`
        : '');
    detProblemas.classList.remove('oculto');
  } else {
    detProblemas.classList.add('oculto');
  }

  // 4. Lista de grupos de duplicados
  if (duplicados.grupos.length > 0) {
    const g = duplicados.grupos.length;
    sumDuplicados.textContent = `Ver ${g} ${plural(g, 'grupo de duplicados', 'grupos de duplicados')}`;
    const coluna = contexto.coluna === null ? '' : contexto.coluna;
    listaDuplicados.innerHTML =
      duplicados.grupos
        .slice(0, LIMITE_LISTA)
        .map((grupo) => {
          const cor = `g${grupo.grupo % CORES_GRUPO}`;
          return `<li><span class="amostra-cor ${cor}"></span><button type="button" class="link-linha" data-linha="${grupo.linhas[0]}" data-coluna="${coluna}">Linhas ${listarLinhas(grupo.linhas)}</button> — ${escapar(resumirTexto(grupo.exemplo))}</li>`;
        })
        .join('') +
      (g > LIMITE_LISTA ? `<li>…e mais ${g - LIMITE_LISTA}</li>` : '');
    detDuplicados.classList.remove('oculto');
  } else {
    detDuplicados.classList.add('oculto');
  }
}

// ---------------------------------------------------------------------------
// Renderização geral
// ---------------------------------------------------------------------------
function renderizar() {
  const linhas = entradaTexto.value.split('\n');

  atualizarSeletorColuna(linhas);
  const coluna = colunaSelecionada();
  const nColunas = Math.min(contarColunas(linhas), MAX_COLUNAS);

  // Duplicados (comparados pela coluna escolhida ou pela linha inteira)
  const valores = extrairValores(linhas, coluna);
  const escolhido = seletorTipoDuplicado.value;
  const automatico = escolhido === 'automatico';
  const tipo = automatico ? detectarTipo(valores) : escolhido;
  duplicados = encontrarDuplicados(valores, tipo);
  contexto = { coluna, tipo, automatico, valores };

  // Problemas só continuam marcados enquanto a linha não for editada
  const problemasAtuais = problemas.filter((p) => linhas[p.linha] === p.texto);
  const marcasProblema = new Map();
  for (const p of problemasAtuais) {
    if (!marcasProblema.has(p.linha)) marcasProblema.set(p.linha, []);
    marcasProblema.get(p.linha).push(p.mensagem);
  }

  desenharEditor(linhas, marcasProblema);
  desenharRelatorio(problemasAtuais, nColunas);
  atualizarContador();
  atualizarBotoesHistorico();
}

// ---------------------------------------------------------------------------
// Aplicação de transformações
// ---------------------------------------------------------------------------

/**
 * Aplica uma função a cada linha (e a cada coluna, se o texto tiver várias).
 * A função pode devolver uma string ou { valor, problema }.
 *
 * opcoes.documento: operação sobre CPF/telefone/números. Em texto com várias
 *   colunas, exige que o usuário escolha a coluna (para não estragar as outras).
 * opcoes.mascara: permite trocar de modo de máscara sobre o texto original.
 */
function executar(funcao, { nome, documento = false, mascara = false } = {}) {
  if (entradaTexto.value === '') {
    exibirNotificacao('Cole ou digite algum texto primeiro');
    return;
  }

  const coluna = colunaSelecionada();
  if (documento && coluna === null && contarColunas(entradaTexto.value.split('\n')) > 1) {
    pedirColuna();
    return;
  }

  let textoBase;
  if (mascara && ultimaAcao === 'mascara' && posicao > 0) {
    // Mascarar de novo: volta ao texto de antes da máscara anterior e aplica o novo modo
    posicao -= 1;
    historico.length = posicao + 1;
    textoBase = historico[posicao];
  } else {
    confirmarSnapshot();
    textoBase = entradaTexto.value;
  }

  const novosProblemas = [];
  let prontos = 0;
  let alterados = 0;

  const novasLinhas = textoBase.split('\n').map((linha, i) =>
    linha
      .split('\t')
      .map((celula, j) => {
        if (coluna !== null && j !== coluna) return celula;
        const vazia = celula.trim() === '';
        if (vazia && documento) return celula;

        const retorno = funcao(celula);
        const resultado = typeof retorno === 'string' ? { valor: retorno, problema: null } : retorno;

        if (resultado.problema) {
          novosProblemas.push({ linha: i, coluna: j, mensagem: resultado.problema });
        } else if (!vazia) {
          prontos += 1;
          if (resultado.valor !== celula) alterados += 1;
        }
        return resultado.valor;
      })
      .join('\t')
  );

  const novoTexto = novasLinhas.join('\n');
  entradaTexto.value = novoTexto;
  if (novoTexto !== historico[posicao]) empilhar(novoTexto);
  ultimaAcao = mascara && novoTexto !== textoBase ? 'mascara' : null;

  problemas = novosProblemas.map((p) => ({ ...p, texto: novasLinhas[p.linha] }));
  resumoAcao = { nome, prontos, alterados, conferir: novosProblemas.length };
  detProblemas.open = novosProblemas.length > 0;

  renderizar();

  if (prontos === 0 && novosProblemas.length === 0) {
    exibirNotificacao('Nada para processar');
  } else if (alterados === 0 && novosProblemas.length === 0) {
    exibirNotificacao('Tudo já estava no padrão');
  }
}

// Botões de documentos e números
$('btn-formatar-cpf').addEventListener('click', () =>
  executar(formatarCPF, { nome: 'CPF', documento: true })
);
$('btn-formatar-telefone').addEventListener('click', () =>
  executar(formatarTelefone, { nome: 'Telefone', documento: true })
);
$('btn-formatar-email').addEventListener('click', () =>
  executar(formatarEmail, { nome: 'E-mail', documento: true })
);
$('btn-apenas-numeros').addEventListener('click', () =>
  executar(apenasNumeros, { nome: 'Apenas números', documento: true })
);
$('btn-mascarar-cpf').addEventListener('click', () => {
  const modo = seletorModoMascara.value;
  executar((texto) => mascararCPF(texto, modo), { nome: 'Máscara de CPF', documento: true, mascara: true });
});

// Botões de texto
$('btn-maiusculas').addEventListener('click', () => executar(paraMaiusculas, { nome: 'Maiúsculas' }));
$('btn-minusculas').addEventListener('click', () => executar(paraMinusculas, { nome: 'Minúsculas' }));
$('btn-primeira-maiuscula').addEventListener('click', () =>
  executar(primeiraLetraMaiuscula, { nome: 'Primeira maiúscula' })
);
$('btn-titulo').addEventListener('click', () =>
  executar(primeiraLetraDeCadaPalavra, { nome: 'Cada palavra maiúscula' })
);
$('btn-remover-acentos').addEventListener('click', () =>
  executar(removerAcentos, { nome: 'Sem acentos' })
);
$('btn-limpar-espacos').addEventListener('click', () =>
  executar(limparEspacosExtras, { nome: 'Espaços limpos' })
);

// ---------------------------------------------------------------------------
// Duplicados
// ---------------------------------------------------------------------------
btnRemoverDuplicadas.addEventListener('click', () => {
  if (entradaTexto.value === '') {
    exibirNotificacao('Cole ou digite algum texto primeiro');
    return;
  }

  renderizar(); // garante que os duplicados estão atualizados
  if (duplicados.repetidas === 0) {
    exibirNotificacao('Nenhuma duplicada encontrada');
    return;
  }

  confirmarSnapshot();
  const linhas = entradaTexto.value.split('\n');
  const novoIndice = new Map(); // posição antiga -> posição nova das linhas mantidas
  const mantidas = [];
  linhas.forEach((linha, i) => {
    const info = duplicados.porLinha[i];
    if (info && info.ocorrencia > 1) return;
    novoIndice.set(i, mantidas.length);
    mantidas.push(linha);
  });

  const removidas = linhas.length - mantidas.length;
  entradaTexto.value = mantidas.join('\n');
  empilhar(entradaTexto.value);
  ultimaAcao = null;

  problemas = problemas
    .filter((p) => novoIndice.has(p.linha))
    .map((p) => ({ ...p, linha: novoIndice.get(p.linha) }));
  resumoAcao = {
    nome: 'Duplicadas',
    mensagem: `${removidas} ${plural(removidas, 'linha removida', 'linhas removidas')} (ficou a 1ª de cada). O total de linhas mudou.`
  };

  renderizar();
});

seletorTipoDuplicado.addEventListener('change', renderizar);
seletorColuna.addEventListener('change', renderizar);

// ---------------------------------------------------------------------------
// Navegação até a linha clicada no relatório
// ---------------------------------------------------------------------------
function irParaLinha(linha, coluna) {
  const linhas = entradaTexto.value.split('\n');
  if (linha >= linhas.length) return;

  let inicio = 0;
  for (let i = 0; i < linha; i++) inicio += linhas[i].length + 1;
  let fim = inicio + linhas[linha].length;

  if (coluna !== null) {
    const celulas = linhas[linha].split('\t');
    for (let j = 0; j < coluna; j++) inicio += celulas[j].length + 1;
    fim = inicio + (celulas[coluna] ?? '').length;
  }

  entradaTexto.focus();
  entradaTexto.setSelectionRange(inicio, fim);

  const topo = linha * ALTURA_LINHA;
  const visivelAte = entradaTexto.scrollTop + entradaTexto.clientHeight - 2 * ALTURA_LINHA - 16;
  if (topo < entradaTexto.scrollTop || topo > visivelAte) {
    entradaTexto.scrollTop = Math.max(0, topo - 2 * ALTURA_LINHA);
  }
  sincronizarRolagem();
}

relatorio.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-linha]');
  if (!botao) return;
  const coluna = botao.dataset.coluna === '' ? null : Number(botao.dataset.coluna);
  irParaLinha(Number(botao.dataset.linha), coluna);
});

// ---------------------------------------------------------------------------
// Entrada, colar, copiar, limpar e atalhos
// ---------------------------------------------------------------------------
btnColar.addEventListener('click', async () => {
  try {
    const textoTransferencia = await navigator.clipboard.readText();
    confirmarSnapshot();
    entradaTexto.value = textoTransferencia;
    if (textoTransferencia !== historico[posicao]) empilhar(textoTransferencia);
    ultimaAcao = null;
    problemas = [];
    resumoAcao = null;
    renderizar();
    exibirNotificacao('Texto colado!');
  } catch (erro) {
    entradaTexto.focus();
    exibirNotificacao('Não consegui ler a área de transferência. Clique no campo e use Ctrl+V.', 3500);
  }
});

// Digitar ou colar manualmente: atualiza o realce e agenda um ponto de retorno no histórico
entradaTexto.addEventListener('input', () => {
  ultimaAcao = null;
  resumoAcao = null;
  clearTimeout(timerSnapshot);
  timerSnapshot = setTimeout(() => {
    confirmarSnapshot();
    atualizarBotoesHistorico();
  }, 600);
  renderizar();
});

entradaTexto.addEventListener('scroll', sincronizarRolagem);

// Ctrl+Z / Ctrl+Y no campo usam o histórico da extensão (o do navegador não enxerga as transformações)
entradaTexto.addEventListener('keydown', (evento) => {
  if (!(evento.ctrlKey || evento.metaKey) || evento.altKey) return;
  const tecla = evento.key.toLowerCase();
  if (tecla === 'z' && !evento.shiftKey) {
    evento.preventDefault();
    desfazer();
  } else if (tecla === 'y' || (tecla === 'z' && evento.shiftKey)) {
    evento.preventDefault();
    refazer();
  }
});

btnDesfazer.addEventListener('click', desfazer);
btnRefazer.addEventListener('click', refazer);

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

btnLimparTudo.addEventListener('click', () => {
  if (entradaTexto.value === '') return;
  confirmarSnapshot();
  entradaTexto.value = '';
  empilhar('');
  ultimaAcao = null;
  problemas = [];
  resumoAcao = null;
  renderizar();
  entradaTexto.focus();
  exibirNotificacao('Texto limpo. Use "Desfazer" para voltar.', 3000);
});

renderizar();
