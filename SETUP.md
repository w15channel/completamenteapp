# 🚀 Guia de Configuração - Completamente App

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior)
- **npm** (versão 8 ou superior) ou **yarn** (versão 1.22 ou superior)

## 🔧 Instalação

### 1. Clonar o Repositório
```bash
git clone https://github.com/w15channel/completamenteapp.git
cd completamenteapp
```

### 2. Instalar Dependências
```bash
# Usando npm
npm install

# Ou usando yarn
yarn install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
# Firebase Configuration (opcional)
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_domínio
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# API Configuration
VITE_API_BASE_URL=http://localhost:3001
```

## 🚀 Executar o Projeto

### Modo Desenvolvimento
```bash
# Usando npm
npm run dev

# Ou usando yarn
yarn dev
```

O aplicativo estará disponível em `http://localhost:3000`

### Build para Produção
```bash
# Usando npm
npm run build

# Ou usando yarn
yarn build
```

Os arquivos buildados ficarão na pasta `dist/`

### Preview do Build
```bash
# Usando npm
npm run preview

# Ou usando yarn
yarn preview
```

## 🔍 Verificação de Tipos

### Type Checking
```bash
# Usando npm
npm run type-check

# Ou usando yarn
yarn type-check
```

### Linting
```bash
# Verificar problemas de código
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix
```

## 🏗️ Estrutura do Projeto

```
completamenteapp/
├── components/          # Componentes React
│   ├── Chat.tsx        # Componente de chat
│   ├── TherapistList.tsx # Lista de terapeutas
│   └── HealthProfile.tsx # Perfil de saúde
├── contexts/           # Contextos React
│   └── AppContext.tsx  # Contexto principal
├── hooks/              # Hooks personalizados
│   ├── useChat.ts      # Hook de chat
│   └── useHealth.ts    # Hook de saúde
├── services/           # Serviços
│   ├── api.ts          # API de IA
│   └── firebase.ts     # Firebase
├── utils/              # Utilitários
│   ├── dateUtils.ts    # Datas
│   └── healthUtils.ts  # Saúde
├── types/              # Tipos TypeScript
│   ├── index.ts        # Tipos principais
│   └── global.d.ts     # Tipos globais
├── css/                # Estilos CSS
├── api/                # APIs backend
├── js/                 # Scripts legados
├── App.tsx             # App principal
├── main.tsx            # Entrada
└── index.html          # HTML
```

## 🐛 Solução de Problemas

### Problemas Comuns

#### 1. "Cannot find module 'react'"
```bash
# Reinstalar dependências
npm install
# Ou
rm -rf node_modules package-lock.json
npm install
```

#### 2. Erros de TypeScript
```bash
# Verificar tipos
npm run type-check

# Se houver erros, verifique se:
# - As dependências estão instaladas
# - O tsconfig.json está correto
# - Não há arquivos .js misturados com .ts
```

#### 3. Problemas com Firebase
```bash
# Verificar configuração no .env
# Certificar que as credenciais estão corretas
# Verificar se o projeto Firebase está ativo
```

#### 4. Porta em uso
```bash
# Mudar porta no vite.config.ts
server: {
  port: 3001, // ou outra porta livre
}
```

### Limpeza e Reinstalação

Se encontrar problemas persistentes:
```bash
# Limpar completamente
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm package-lock.json

# Reinstalar tudo
npm install
```

## 📱 Desenvolvimento

### Adicionar Novos Componentes

1. Criar arquivo em `components/`
2. Exportar como padrão
3. Usar TypeScript com tipagem forte
4. Seguir padrões de nomenclatura

### Adicionar Novos Hooks

1. Criar arquivo em `hooks/`
2. Usar prefixo `use`
3. Retornar valores tipados
4. Documentar com JSDoc

### Modificar Serviços

1. Atualizar tipos em `types/`
2. Modificar implementação em `services/`
3. Testar com hooks
4. Atualizar componentes

## 🔧 Configuração Ferramentas

### VS Code

Instale estas extensões:
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint

### Configuração VS Code

Crie `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conectar repositório GitHub ao Vercel
2. Configurar variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas

```bash
# Build para produção
npm run build

# A pasta 'dist' contém os arquivos para deploy
```

## 📚 Recursos

- [Documentação React](https://react.dev/)
- [Documentação TypeScript](https://www.typescriptlang.org/)
- [Documentação Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contribuição

1. Fork o projeto
2. Criar branch de feature
3. Fazer commit das mudanças
4. Push para o branch
5. Abrir Pull Request

## 📄 Licença

MIT License - ver arquivo LICENSE para detalhes

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique este guia
2. Consulte os logs do console
3. Abra uma issue no GitHub
4. Contate a equipe de desenvolvimento

**Desenvolvimento Feliz! 🎉**
