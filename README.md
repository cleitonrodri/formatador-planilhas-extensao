# 🛠️ Formatador de Texto e Planilhas (Chrome Extension)

Extensão para navegadores baseados no Chromium (Google Chrome, Microsoft Edge, Brave) construída para padronizar dados que chegam com formatações diferentes (respostas de formulários, planilhas, e-mails e sistemas corporativos).

A ferramenta roda em uma **barra lateral fixa (Side Panel)**, permitindo copiar, transformar e colar dados em lote sem perder o foco da planilha ou da página aberta.

> 🔒 **Privacidade:** todo o processamento acontece localmente no navegador. Nenhum dado é enviado para servidores. A extensão pede apenas as permissões de área de transferência e de painel lateral.

---

## 🚀 Funcionalidades

### Documentos e contatos
- **Formatar CPF** (`000.000.000-00`): confere os dígitos verificadores e só restaura zeros à esquerda cortados pela planilha quando o resultado é um CPF válido. Nunca inventa dígitos.
- **Mascarar CPF (LGPD)** em três modos: `123.***.***-00`, `***.456.789-**` e `***.***.***-00`. Trocar de modo parte sempre do texto original.
- **Telefone / Celular** (`(00) 00000-0000`): aceita `+55` e `0` antes do DDD, confere se o DDD existe e avisa quando falta DDD ou dígito.
- **Padronizar e-mail**: tira espaços e caracteres invisíveis, coloca em minúsculas e confere o formato (falta de `@`, domínio incompleto, acento, mais de um e-mail na célula). Domínios com erro de digitação comum (`gmial.com`) são avisados, mas nunca corrigidos sozinhos.
- **Apenas números**: extrai os dígitos de qualquer texto.

### Texto
- `MAIÚSCULAS`, `minúsculas`, `Primeira maiúscula` e `Cada Palavra Maiúscula` (preposições como *da*, *de*, *dos* ficam em minúsculas; trata hífen, apóstrofo e numerais romanos: `Ana-Clara D'Ávila`, `Pedro II`).
- Remoção de acentos.
- Limpeza de espaços duplicados e de caracteres invisíveis (comuns em textos copiados de formulários).

### Duplicados
- Linhas repetidas ficam **coloridas automaticamente** no campo de texto (cada valor repetido ganha uma cor) e a calha de números marca onde estão.
- A comparação é inteligente: `123.456.789-00` e `12345678900` são o mesmo CPF; `Ana@Gmail.com` e `ana@gmail.com` são o mesmo e-mail; telefones com ou sem `+55`/pontuação também. O tipo é detectado automaticamente (CPF, telefone, e-mail ou texto) e pode ser escolhido manualmente.
- Valores **mascarados** (`***.***.***-25`) não entram na comparação, porque a máscara esconde dígitos e dois CPFs diferentes podem ficar iguais.
- **Remover duplicadas** mantém a primeira ocorrência de cada valor. Atenção: isso muda o número de linhas (use **Desfazer** para voltar).

### Conferência e segurança dos dados
- Depois de cada ação aparece um resumo (`✔ 118 prontos (97 alterados) · ⚠ 2 para conferir`).
- Linhas com problema ficam sublinhadas em vermelho e listadas no painel; clicar na lista leva até a linha.
- **Desfazer / Refazer** (botões ou `Ctrl+Z` / `Ctrl+Y`) valem para todas as ações, inclusive Limpar.

### Várias colunas
- Ao colar dados de várias colunas da planilha, aparece o seletor **Coluna**. As ações de CPF, telefone, e-mail e números exigem escolher a coluna (para não alterar as outras); as de texto podem ser aplicadas a todas. Os duplicados são comparados pela coluna escolhida.

---

## 🧭 Como usar
1. Copie os dados da planilha (`Ctrl+C`).
2. Clique em **📋 Colar** (ou use `Ctrl+V` no campo).
3. Clique na ação desejada e confira o resumo.
4. Clique em **Copiar Resultado** e cole de volta na planilha.

---

## 🛠️ Tecnologias Utilizadas
- **JavaScript Moderno (ES6+ Modules)**
- **Chrome Extension API (Manifest V3 - Side Panel & Clipboard API)**
- **HTML5 & CSS3**
- Testes com o executor nativo do Node (`node --test`), sem dependências

---

## 📦 Como Instalar Localmente
1. Clone este repositório (ou baixe o ZIP e extraia):
   ```bash
   git clone https://github.com/cleitonrodri/formatador-planilhas-extensao.git
   ```
2. No navegador, abra `chrome://extensions` (no Edge, `edge://extensions`).
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto (a que contém o `manifest.json`).
5. Clique no ícone da extensão para abrir o painel lateral. Requer Chrome 114 ou superior.

---

## ✅ Testes
Requer Node.js 18 ou superior:
```bash
npm test
```
Os testes cobrem as funções de formatação (`src/utils/formatadores.js`) e a detecção de duplicados (`src/utils/duplicados.js`), incluindo casos de borda: zeros cortados, notação científica, CPF já mascarado, telefone com `+55`, DDD inexistente e colagem com várias colunas.

---

## 📁 Estrutura
```
manifest.json
src/
  background/background.js   # abre o painel ao clicar no ícone
  popup/                     # interface do painel lateral (HTML, CSS, JS)
  utils/formatadores.js      # CPF, telefone, e-mail e funções de texto
  utils/duplicados.js        # detecção de duplicados
tests/                       # testes automatizados
```

---

## 📝 Histórico de versões
- **1.2.0**
  - Novo: botão **Padronizar e-mail**.
  - Novo: duplicados destacados por cor, relatório com problemas clicáveis, Desfazer/Refazer, seletor de coluna.
  - Corrigido: CPF e telefone não geram mais dados falsos a partir de texto, números soltos, telefone, notação científica ou CPF já mascarado; colar várias colunas não perde mais as outras colunas.
  - Melhorado: nomes (hífen, apóstrofo, romanos), limpeza de caracteres invisíveis, telefone com `+55`/`0` e validação de DDD.
  - Removido: formatação de CNPJ (fora do escopo de uso).
