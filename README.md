# 🛠️ Formatador de Texto e Planilhas (Chrome Extension)

Extensão para navegadores baseados no Chromium (Google Chrome, Microsoft Edge, Brave) construída para otimizar o tratamento de dados no dia a dia em Google Planilhas, Excel Web, e-mails e sistemas corporativos.

A ferramenta roda diretamente em uma **barra lateral fixa (Side Panel)**, permitindo selecionar, copiar, transformar e colar dados em lote sem perder o foco das células ou páginas abertas.

---

## 🚀 Funcionalidades
- **Tratamento de Documentos:**
  - Formatar CPF (`000.000.000-00`) com preenchimento automático de zeros à esquerda cortados por planilhas.
  - Mascarar CPF (LGPD) em múltiplos modos (`123.***.***-00`, `***.456.789-**`, `***.***.***-00`).
  - Formatar CNPJ (`00.000.000/0000-00`) com correção de zeros à esquerda.
  - Formatar Telefone e Celular com DDD `(00) 00000-0000`.
  - Extrair apenas dígitos/números de qualquer cadeia de texto.
- **Manipulação de Texto:**
  - `MAIÚSCULAS`, `minúsculas`, `Primeira letra da frase` e `Primeira Letra De Cada Palavra`.
  - Remoção de acentos e diacríticos.
  - Limpeza de espaços duplicados e quebras soltas.
- **Produtividade em Lote:**
  - Processa múltiplas linhas de dados simultaneamente mantendo a integridade da lista.
  - Botões rápidos de captura e envio para a área de transferência (*Clipboard*).

---

## 🛠️ Tecnologias Utilizadas
- **JavaScript Moderno (ES6+ Modules)**
- **Chrome Extension API (Manifest V3 - Side Panel & Clipboard API)**
- **HTML5 & CSS3**

---

## 📦 Como Instalar Localmente
1. Clone este repositório ou baixe os arquivos:
   ```bash ou CMD
   git clone [https://github.com/cleitonrodri/formatador-planilhas-extensao.git](https://github.com/cleitonrodri/formatador-planilhas-extensao.git)