import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  apenasNumeros,
  cpfValido,
  formatarCPF,
  mascararCPF,
  formatarTelefone,
  formatarEmail,
  normalizarDigitosTelefone,
  primeiraLetraMaiuscula,
  primeiraLetraDeCadaPalavra,
  limparEspacosExtras,
  removerAcentos
} from '../src/utils/formatadores.js';

// CPFs válidos de teste (dígitos verificadores corretos)
const CPF_A = '52998224725'; // 529.982.247-25
const CPF_B = '11144477735'; // 111.444.777-35
const CPF_COM_ZERO = '01234567890'; // 012.345.678-90

test('cpfValido confere os dígitos verificadores', () => {
  assert.equal(cpfValido(CPF_A), true);
  assert.equal(cpfValido(CPF_B), true);
  assert.equal(cpfValido(CPF_COM_ZERO), true);
  assert.equal(cpfValido('12345678900'), false);
  assert.equal(cpfValido('11111111111'), false);
  assert.equal(cpfValido('123'), false);
});

test('formatarCPF: CPF válido com ou sem pontuação', () => {
  assert.deepEqual(formatarCPF(CPF_A), { valor: '529.982.247-25', problema: null });
  assert.deepEqual(formatarCPF('529.982.247-25'), { valor: '529.982.247-25', problema: null });
  assert.deepEqual(formatarCPF('  529 982 247 25 '), { valor: '529.982.247-25', problema: null });
});

test('formatarCPF: restaura zero cortado pela planilha só se o CPF ficar válido', () => {
  assert.deepEqual(formatarCPF('1234567890'), { valor: '012.345.678-90', problema: null });
  const r = formatarCPF('1234567891'); // com zero não fica válido
  assert.equal(r.valor, '1234567891');
  assert.match(r.problema, /não gera um CPF válido/);
});

test('formatarCPF: 11 dígitos inválidos são formatados, mas marcados', () => {
  const r = formatarCPF('12345678900');
  assert.equal(r.valor, '123.456.789-00');
  assert.match(r.problema, /inválido/);
});

test('formatarCPF: não inventa CPF a partir de lixo (casos que antes davam CPF falso)', () => {
  const casos = {
    '5': /Faltam dígitos/,
    'João 123': /letras/,
    '(11) 91234-5678': /inválido/, // 11 dígitos de telefone: formata, mas avisa
    '***.456.789-**': /mascarado/,
    '1,23457E+10': /notação científica/,
    '123456789012345': /dígitos/
  };
  for (const [entrada, esperado] of Object.entries(casos)) {
    const r = formatarCPF(entrada);
    assert.match(r.problema, esperado, `entrada: ${entrada}`);
  }
  // entradas que não podem ser formatadas voltam exatamente como entraram
  for (const entrada of ['5', 'João 123', '***.456.789-**', '1,23457E+10']) {
    assert.equal(formatarCPF(entrada).valor, entrada);
  }
});

test('formatarCPF: vazio não é problema', () => {
  assert.deepEqual(formatarCPF(''), { valor: '', problema: null });
  assert.deepEqual(formatarCPF('   '), { valor: '   ', problema: null });
});

test('mascararCPF: três modos', () => {
  assert.equal(mascararCPF(CPF_A, 'meio').valor, '529.***.***-25');
  assert.equal(mascararCPF(CPF_A, 'pontas').valor, '***.982.247-**');
  assert.equal(mascararCPF(CPF_A, 'so_final').valor, '***.***.***-25');
  assert.equal(mascararCPF(CPF_A).valor, '529.***.***-25');
});

test('mascararCPF: não corrompe CPF já mascarado e restaura zero cortado', () => {
  const ja = mascararCPF('***.982.247-**', 'meio');
  assert.equal(ja.valor, '***.982.247-**');
  assert.match(ja.problema, /mascarado/);
  assert.equal(mascararCPF('1234567890', 'meio').valor, '012.***.***-90');
});

test('formatarTelefone: celular e fixo', () => {
  assert.deepEqual(formatarTelefone('11912345678'), { valor: '(11) 91234-5678', problema: null });
  assert.deepEqual(formatarTelefone('(11) 91234-5678'), { valor: '(11) 91234-5678', problema: null });
  assert.deepEqual(formatarTelefone('1133334444'), { valor: '(11) 3333-4444', problema: null });
});

test('formatarTelefone: +55 e zero antes do DDD', () => {
  assert.equal(formatarTelefone('+55 11 91234-5678').valor, '(11) 91234-5678');
  assert.equal(formatarTelefone('5511912345678').valor, '(11) 91234-5678');
  assert.equal(formatarTelefone('011 91234-5678').valor, '(11) 91234-5678');
  assert.equal(formatarTelefone('+55 55 3222-1234').valor, '(55) 3222-1234'); // DDD 55 (RS)
});

test('formatarTelefone: problemas são avisados em vez de ficarem calados', () => {
  assert.match(formatarTelefone('912345678').problema, /Sem DDD/);
  assert.equal(formatarTelefone('912345678').valor, '912345678');
  assert.match(formatarTelefone('20912345678').problema, /DDD 20/);
  assert.match(formatarTelefone('1191234567').problema, /celular sem o 9/);
  assert.match(formatarTelefone('11812345678').problema, /começar com 9/);
  assert.match(formatarTelefone('123').problema, /Quantidade de dígitos/);
  assert.match(formatarTelefone('+1 202 555 0100').problema, /outro país/);
  assert.match(formatarTelefone('0800 123 4567').problema, /0800/);
  assert.match(formatarTelefone('1,19123E+10').problema, /notação científica/);
  assert.match(formatarTelefone('11 9xxxx-xxxx').problema, /letras/);
});

test('formatarEmail: limpa e padroniza', () => {
  assert.deepEqual(formatarEmail('ana@gmail.com'), { valor: 'ana@gmail.com', problema: null });
  assert.deepEqual(formatarEmail('  Ana.Silva@Gmail.COM '), { valor: 'ana.silva@gmail.com', problema: null });
  assert.equal(formatarEmail('ana @gmail.com').valor, 'ana@gmail.com');
  assert.equal(formatarEmail('ana\u200b@gmail.com').valor, 'ana@gmail.com'); // caractere invisível
  assert.equal(formatarEmail('mailto:ana@gmail.com').valor, 'ana@gmail.com');
  assert.equal(formatarEmail('<ana@gmail.com>').valor, 'ana@gmail.com');
  assert.equal(formatarEmail('ana@gmail.com.').valor, 'ana@gmail.com'); // ponto solto no fim
  assert.equal(formatarEmail('ana+rh@orgao.gov.br').problema, null);
  assert.deepEqual(formatarEmail('   '), { valor: '   ', problema: null });
});

test('formatarEmail: o que não dá para consertar é marcado e volta como entrou', () => {
  const casos = {
    'ana.gmail.com': /Falta o @/,
    '@gmail.com': /antes do @/,
    'ana@': /Falta o domínio/,
    'ana@gmail': /Domínio incompleto/,
    'ana@gmail..com': /Domínio inválido/,
    'ana silva@gmail.com': /espaço no meio/,
    'joão@gmail.com': /acento/,
    'a@x.com, b@y.com': /mais de um @/,
    '.ana@gmail.com': /antes do @/
  };
  for (const [entrada, esperado] of Object.entries(casos)) {
    const r = formatarEmail(entrada);
    assert.match(r.problema, esperado, `entrada: ${entrada}`);
    assert.equal(r.valor, entrada, `não deve alterar: ${entrada}`);
  }
});

test('formatarEmail: domínio com erro de digitação é avisado, mas não corrigido', () => {
  const r = formatarEmail('Ana@Gmial.com');
  assert.equal(r.valor, 'ana@gmial.com');
  assert.match(r.problema, /gmail\.com/);
});

test('normalizarDigitosTelefone remove +55 e zero do DDD', () => {
  assert.equal(normalizarDigitosTelefone('+55 (11) 91234-5678'), '11912345678');
  assert.equal(normalizarDigitosTelefone('011 91234-5678'), '11912345678');
});

test('primeiraLetraDeCadaPalavra: nomes', () => {
  assert.equal(primeiraLetraDeCadaPalavra('maria da silva'), 'Maria da Silva');
  assert.equal(primeiraLetraDeCadaPalavra('JOÃO  DA   SILVA'), 'João da Silva');
  assert.equal(primeiraLetraDeCadaPalavra("ana-clara d'ávila"), "Ana-Clara D'Ávila");
  assert.equal(primeiraLetraDeCadaPalavra('pedro ii'), 'Pedro II');
  assert.equal(primeiraLetraDeCadaPalavra('  carlos  e  souza '), 'Carlos e Souza');
  assert.equal(primeiraLetraDeCadaPalavra('de souza'), 'De Souza'); // preposição na 1ª palavra fica maiúscula
  assert.equal(primeiraLetraDeCadaPalavra(''), '');
});

test('primeiraLetraMaiuscula funciona mesmo com espaço ou aspas no início', () => {
  assert.equal(primeiraLetraMaiuscula('  olá. tudo bem'), '  Olá. tudo bem');
  assert.equal(primeiraLetraMaiuscula('"BEM VINDO"'), '"Bem vindo"');
  assert.equal(primeiraLetraMaiuscula('1 teste'), '1 teste');
});

test('limparEspacosExtras remove espaços duplos e caracteres invisíveis', () => {
  assert.equal(limparEspacosExtras('  ana​   silva   '), 'ana silva');
});

test('removerAcentos e apenasNumeros', () => {
  assert.equal(removerAcentos('Conceição Ávila'), 'Conceicao Avila');
  assert.equal(apenasNumeros('(11) 91234-5678'), '11912345678');
});
