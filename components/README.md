# 📁 Estrutura de Componentes

Esta pasta contém todos os componentes individuais da aplicação, permitindo edição e manutenção independente de cada seção.

## 🏗️ Arquitetura de Componentes

### 📋 Lista de Componentes

| Componente | Arquivo | Descrição |
|-----------|---------|----------|
| **Header** | `Header.tsx` | Cabeçalho principal com branding |
| **ConsentModal** | `ConsentModal.tsx` | Modal de consentimento e termos |
| **Onboarding** | `Onboarding.tsx` | Tela de login/cadastro |
| **Home** | `Home.tsx` | Dashboard principal com navegação |
| **Saude** | `Saude.tsx` | Saúde & Corpo (perfil, água, nutrição, etc.) |
| **Routines** | `Routines.tsx` | Minha Rotina (tarefas e metas) |
| **Relacional** | `Relacional.tsx` | Espaço Relacional (pessoal, parceria, etc.) |
| **Financas** | `Financas.tsx` | Controle Financeiro |
| **Relaxation** | `Relaxation.tsx` | Relaxamento & Foco (vídeos, jogos, arte) |
| **ChatSelection** | `ChatSelection.tsx` | Seleção de terapeutas |
| **Chat** | `Chat.tsx` | Interface de chat |

## 🔧 Como Funciona

### Estrutura Individual
Cada componente é independente e contém:
- **HTML estruturado** da seção
- **Event handlers** específicos
- **Estilos referenciados** do CSS global
- **Funcionalidades isoladas**

### Importação Centralizada
```typescript
import { renderHome, renderSaude, renderChat } from './components/index.js';
```

### Renderização
```typescript
// Renderizar componente individual
document.getElementById('app').innerHTML = renderHome();

// Renderizar todos os componentes
document.getElementById('app').innerHTML = renderAllComponents();
```

## 🎯 Benefícios

### ✅ Manutenção Independente
- Editar **Home.tsx** não afeta **Saude.tsx**
- Cada componente tem seu **escopo bem definido**
- **Debug isolado** de problemas

### ✅ Desenvolvimento Paralelo
- Múltiplos desenvolvedores podem trabalhar em componentes diferentes
- **Sem conflitos** de código
- **Revisões focadas** por componente

### ✅ Testes Unitários
- Cada componente pode ser **testado individualmente**
- **Mock fácil** de dependências
- **Coverage** específico por componente

### ✅ Reutilização
- Componentes podem ser **reutilizados** em outras páginas
- **Composição** de componentes maiores
- **Padronização** de UI

## 🔄 Fluxo de Trabalho

### 1. Edição de Componente
```bash
# Editar componente específico
vim components/Home.tsx
```

### 2. Teste Local
```bash
# Testar apenas o componente modificado
npm run test:home
```

### 3. Deploy
```bash
# Deploy com verificação de integridade
npm run build && npm run deploy
```

## 📝 Convenções

### Nomenclatura
- **PascalCase** para nomes de arquivos
- **Funções render** prefixadas com `render`
- **IDs HTML** mantidos do original

### Estrutura do Arquivo
```typescript
// Componente.tsx
export function renderComponent() {
  return `
    <!-- HTML do componente -->
  `;
}
```

### Event Handlers
- Mantidos os **event handlers originais**
- **window.functionName** preservados
- **Integração** com js/app.js mantida

## 🚀 Exemplos de Uso

### Adicionar Novo Componente
```typescript
// components/NovoComponente.tsx
export function renderNovoComponente() {
  return `
    <section id="novo-componente" class="tab-content">
      <!-- HTML do novo componente -->
    </section>
  `;
}
```

### Modificar Componente Existente
```typescript
// Editar components/Home.tsx
export function renderHome() {
  return `
    <section id="home" class="tab-content relative">
      <!-- Modificação aqui -->
      <div class="nova-feature">Nova funcionalidade</div>
      <!-- Restante do componente -->
    </section>
  `;
}
```

### Integrar com JavaScript
```javascript
// js/app.js
import { renderHome } from '../components/index.js';

// Renderizar componente dinamicamente
function showHome() {
  document.getElementById('main-area').innerHTML = renderHome();
}
```

## 🔍 Debug e Manutenção

### Problemas Comuns
1. **IDs duplicados** - Verificar unicidade de IDs
2. **Event handlers perdidos** - Garantir que window.* esteja acessível
3. **CSS não aplicado** - Verificar classes CSS no arquivo global

### Ferramentas de Debug
- **Browser DevTools** para inspecionar componentes
- **Console** para verificar erros de renderização
- **Network** para validar carregamento de recursos

## 📈 Performance

### Otimizações
- **Lazy loading** de componentes pesados
- **Code splitting** por rota
- **Cache** de componentes renderizados

### Métricas
- **Bundle size** por componente
- **Render time** de cada seção
- **Memory usage** por componente

---

**Esta estrutura modular permite manutenção eficiente e desenvolvimento escalável da aplicação! 🚀**
