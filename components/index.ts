// index.ts - Exportação centralizada de todos os componentes
import { renderHeader } from './Header.js';
import { renderConsentModal } from './ConsentModal.js';
import { renderOnboarding } from './Onboarding.js';
import { renderHome } from './Home.js';
import { renderSaude } from './Saude.js';
import { renderRoutines } from './Routines.js';
import { renderRelacional } from './Relacional.js';
import { renderFinancas } from './Financas.js';
import { renderRelaxation } from './Relaxation.js';
import { renderChatSelection } from './ChatSelection.js';
import { renderChat } from './Chat.js';

// Exportação de todos os componentes
export {
  renderHeader,
  renderConsentModal,
  renderOnboarding,
  renderHome,
  renderSaude,
  renderRoutines,
  renderRelacional,
  renderFinancas,
  renderRelaxation,
  renderChatSelection,
  renderChat
};

// Função para renderizar todos os componentes
export function renderAllComponents() {
  return `
    ${renderHeader()}
    ${renderConsentModal()}
    ${renderOnboarding()}
    ${renderHome()}
    ${renderSaude()}
    ${renderRoutines()}
    ${renderRelacional()}
    ${renderFinancas()}
    ${renderRelaxation()}
    ${renderChatSelection()}
    ${renderChat()}
  `;
}
