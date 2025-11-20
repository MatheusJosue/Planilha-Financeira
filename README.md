# 📊 Planilha Financeira

Sistema completo de gestão financeira pessoal desenvolvido com Next.js, React e Supabase. Permite controle detalhado de receitas, despesas, transações recorrentes e projeções futuras com visualizações interativas.

## 🎯 Sobre o Projeto

A **Planilha Financeira** é uma aplicação web moderna para gerenciamento de finanças pessoais que oferece:

- **Dashboard Interativo**: Visualização completa da saúde financeira com gráficos e estatísticas
- **Gestão de Transações**: Controle de receitas e despesas com categorização
- **Transações Recorrentes**: Automatização de lançamentos mensais fixos
- **Projeções Futuras**: Previsão de fluxo de caixa baseado em transações recorrentes
- **Controle Mensal**: Navegação entre diferentes meses com histórico completo
- **Categorias Personalizadas**: Criação e gestão de categorias com limites de gastos
- **Autenticação Segura**: Sistema de login com Supabase Auth
- **Relatórios em PDF**: Exportação de relatórios financeiros detalhados

## 🏗️ Estrutura do Projeto

```
Planilha-Financeira/
├── app/                    # Rotas e páginas da aplicação (Next.js App Router)
│   ├── auth/               # Autenticação e callbacks OAuth
│   ├── configuracoes/      # Gerenciamento de categorias e configurações
│   ├── login/              # Tela de login e registro
│   ├── recorrentes/        # Gestão de transações recorrentes
│   └── transacoes/         # Listagem e CRUD de transações
│
├── components/             # Componentes React reutilizáveis
│   └── Charts/             # Gráficos e visualizações de dados
│
├── store/                  # Gerenciamento de estado global (Zustand)
│
├── types/                  # Definições de tipos TypeScript
│
├── lib/                    # Bibliotecas e configurações (Supabase, alertas)
│
├── hooks/                  # Custom React Hooks
│
├── utils/                  # Funções utilitárias e helpers
│
├── supabase/               # Configurações e migrações do banco de dados
│   └── migrations/         # Scripts de migração do PostgreSQL
│
└── public/                 # Arquivos estáticos (imagens, ícones, etc)

```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática
- **React Bootstrap** - Componentes UI responsivos
- **Tailwind CSS** - Estilização utilitária
- **Recharts** - Biblioteca de gráficos interativos
- **React Icons** - Ícones

### Estado e Dados
- **Zustand** - Gerenciamento de estado global simplificado
- **Supabase** - Backend as a Service (BaaS)
  - Autenticação de usuários
  - Banco de dados PostgreSQL
  - Real-time subscriptions

### Utilitários
- **date-fns** - Manipulação de datas
- **SweetAlert2** - Alertas e modais elegantes
- **jsPDF** - Geração de PDFs
- **@react-pdf/renderer** - Renderização de PDFs com React
- **@dnd-kit** - Drag and drop

## 📦 Instalação

### Pré-requisitos
- Node.js 20+ instalado
- Conta no Supabase (gratuita)

### Passos

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd Planilha-Financeira
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Configure o banco de dados**

Execute as migrações do Supabase localizadas em `supabase/migrations/`

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Acesse a aplicação**

Abra [http://localhost:3000](http://localhost:3000) no navegador

## 🚀 Scripts Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Cria build de produção
npm run start    # Inicia servidor de produção
npm run lint     # Executa o linter
```

## 📊 Funcionalidades Principais

### 1. Dashboard
- Resumo financeiro com saldo, receitas e despesas
- Gráficos interativos:
  - Despesas por categoria (pizza)
  - Receitas vs Despesas (barras)
  - Gastos recorrentes vs variáveis
  - Projeção futura de saldo
- Estatísticas detalhadas e indicadores

### 2. Transações
- Adicionar receitas e despesas
- Categorização personalizada
- Marcar como pago/não pago
- Editar e excluir transações
- Filtros e busca
- Conversão de transações previstas em reais

### 3. Transações Recorrentes
- Criar lançamentos automáticos mensais
- Configurar frequência (mensal, anual, etc.)
- Gerar transações previstas automaticamente
- Editar e excluir recorrências

### 4. Configurações
- Gerenciar categorias personalizadas
- Definir limites de gastos por categoria
- Ocultar categorias padrão
- Importar/exportar dados
- Limpar todos os dados

### 5. Controle Mensal
- Navegar entre diferentes meses
- Criar novos meses
- Copiar transações do mês anterior
- Histórico completo

## 🗄️ Estrutura de Dados

### Transaction (Transação)
```typescript
{
  id: string
  description: string
  type: 'income' | 'expense'
  category: string
  value: number
  date: string
  is_paid?: boolean
  is_predicted?: boolean
  recurring_transaction_id?: string
}
```

### RecurringTransaction (Transação Recorrente)
```typescript
{
  id: string
  description: string
  type: 'income' | 'expense'
  category: string
  value: number
  frequency: 'monthly' | 'yearly'
  start_date: string
  end_date?: string
  day_of_month: number
  is_active: boolean
}
```

## 🎨 Temas e Estilos

O projeto utiliza uma combinação de:
- **Bootstrap** para componentes base
- **Tailwind CSS** para estilização customizada
- **CSS Modules** para estilos específicos
- Tema escuro/claro (configurável)

## 🔐 Autenticação

Sistema de autenticação completo com Supabase:
- Login com email/senha
- Registro de novos usuários
- Recuperação de senha
- Sessões persistentes
- Proteção de rotas

## 📱 Responsividade

Interface totalmente responsiva que se adapta a:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido com ❤️ para facilitar o controle financeiro pessoal.

## 🐛 Problemas Conhecidos

- Verificar warning de setState em useEffect no RecurringTransactionForm.tsx

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

**Nota**: Lembre-se de configurar corretamente as variáveis de ambiente e o banco de dados Supabase antes de usar a aplicação.
