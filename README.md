# 🥧 Sistema de Controle de Empadas

Sistema completo para controle de estoque, vendas e gestão de empadas e empadões, desenvolvido em React com TypeScript e Firebase.

## 📋 Funcionalidades

### 🏠 Dashboard
- Visão geral do negócio
- Métricas principais
- Gráficos de performance

### 📊 Controle Diário
- **Contagem de Estoque**: Registro de freezer, estufa e perdas
- **Saldo Anterior**: Carregamento automático do dia anterior
- **Pedidos**: Sistema de pedidos com preços e cálculos
- **Vendas**: Cálculo automático de vendas do dia
- **Saldo Previsto**: Projeção com base em pedidos

### 📈 Relatórios
- **Semanal**: Análise de vendas e performance por semana
- **Mensal**: Relatórios consolidados por mês
- **Comparações**: Análise de crescimento e tendências

### 💰 Gestão Financeira
- **Pagamentos**: Controle de recebimentos
- **Custos**: Gestão de despesas e investimentos
- **Preços**: Tabela de preços atualizada

### 🤖 Sistema de Sugestões
- IA para otimização de estoque
- Sugestões de pedidos
- Análise de tendências

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Roteamento**: React Router DOM
- **Backend**: Firebase Firestore
- **Estilização**: CSS3
- **Linting**: ESLint

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta Firebase

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/controle-emp.git
cd controle-emp
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure o Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o Firestore Database
3. Copie as configurações do Firebase
4. Crie o arquivo `src/firebase.ts` com suas credenciais:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### 4. Execute o projeto
```bash
npm run dev
# ou
yarn dev
```

O projeto estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Navbar.tsx      # Barra de navegação
│   ├── SistemaSugestoes.tsx
│   └── TabelaPrecos.tsx
├── pages/              # Páginas principais
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   ├── ControleDiario.tsx
│   ├── Semana.tsx
│   ├── Mes.tsx
│   ├── Pagamento.tsx
│   └── Custos.tsx
├── services/          # Serviços e APIs
│   └── firebaseService.ts
├── types/             # Definições de tipos
│   ├── Contagem.ts
│   ├── ContagemItem.ts
│   ├── Empada.ts
│   └── Precos.ts
├── routes/            # Configuração de rotas
│   └── index.tsx
├── firebase.ts        # Configuração Firebase
└── App.tsx           # Componente principal
```

## 🗄️ Estrutura do Banco de Dados

### Coleção: `contagem_diaria`
```typescript
{
  data: string,                    // YYYY-MM-DD
  itens: ContagemItem[],           // Lista de sabores
  pedidoCaixas: number[],          // Pedidos em caixas
  recebidoHoje: (number|'')[],    // Recebido hoje
  resumo: {                       // Resumo do dia
    totalFreezer: number,
    totalEstufa: number,
    totalPerdas: number,
    totalEmpadas: number,
    vendasDia: number,
    // ... outros campos
  },
  saldoAnteriorPorSabor: Record<string, number>,
  pedidos: Pedido[],              // Pedidos para custos
  dataCriacao: Date,
  dataAtualizacao?: Date
}
```

### Coleção: `pedidos`
```typescript
{
  id: string,
  data: Date,
  sabor: string,
  tipo: 'EMPADA' | 'EMPADÃO',
  quantidade: number,
  precoUnidade: number,
  precoTotal: number,
  fornecedor: string,
  status: 'pendente' | 'confirmado' | 'entregue'
}
```

## 🎯 Como Usar

### 1. Controle Diário
- Acesse `/contagem`
- Selecione a data
- Preencha os dados de freezer, estufa e perdas
- Adicione pedidos se necessário
- Salve a contagem

### 2. Relatórios
- **Semanal**: `/semana` - Análise por semana
- **Mensal**: `/mes` - Relatórios mensais

### 3. Gestão Financeira
- **Pagamentos**: `/pagamentos` - Controle de recebimentos
- **Custos**: `/custos` - Gestão de despesas

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Executa em modo desenvolvimento
npm run build    # Gera build de produção
npm run preview  # Visualiza build de produção
npm run lint     # Executa linter
```

## 📊 Sabores Suportados

### Empadas (22 sabores)
4 Queijos, Bacalhau, Banana, Calabresa, Camarão, Camarão com Requeijão, Carne Seca, Carne Seca com Requeijão, Chocolate, Frango, Frango com Ameixa e Bacon, Frango com Azeitona, Frango com Bacon, Frango com Cheddar, Frango com Palmito, Frango com Requeijão, Palmito, Pizza, Queijo, Queijo com Alho, Queijo com Cebola, Romeu e Julieta

### Empadões (5 sabores)
Camarão, Carne Seca, Frango, Frango com Azeitona, Frango com Requeijão

## 🎨 Personalização

### Cores e Temas
O sistema usa um tema escuro por padrão. Para personalizar, edite os arquivos CSS em `src/pages/` e `src/components/`.

### Preços
Os preços podem ser atualizados no arquivo `src/pages/ControleDiario.tsx` na constante `PRECOS_PEDIDO`.

## 🐛 Solução de Problemas

### Erro de Conexão Firebase
- Verifique se as credenciais estão corretas
- Confirme se o Firestore está ativado
- Verifique as regras de segurança do Firestore

### Dados não aparecem
- Verifique o console do navegador para erros
- Confirme se os dados estão sendo salvos no Firebase
- Verifique a estrutura dos documentos

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato via email: [seu-email@exemplo.com]

## 🔄 Changelog

### v1.0.0
- ✅ Sistema de controle diário
- ✅ Relatórios semanais e mensais
- ✅ Gestão de pedidos
- ✅ Sistema de sugestões
- ✅ Interface responsiva

---

**Desenvolvido com ❤️ para otimizar o controle de empadas!**