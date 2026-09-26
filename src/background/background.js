/**
 * Configura o comportamento do painel lateral ao clicar no ícone da extensão
 */
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((erro) => console.error("Erro ao configurar painel lateral:", erro));

console.log("Serviço de segundo plano do Formatador inicializado com sucesso.");