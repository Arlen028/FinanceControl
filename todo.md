# Sistema de Gerenciamento Financeiro Pessoal - TODO

## Arquitetura
- **Frontend**: Next.js + TypeScript + Tailwind CSS + Shadcn-UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Autenticação**: Supabase Auth (JWT)
- **Gráficos**: Recharts

## Estrutura de Arquivos (8 arquivos principais)

### 1. src/lib/supabase.ts
- Configuração do cliente Supabase
- Funções auxiliares de autenticação

### 2. src/types/index.ts
- Tipos TypeScript para Transaction, Budget, User
- Interfaces para dados financeiros

### 3. src/pages/Login.tsx
- Página de login e cadastro
- Formulários com validação
- Integração com Supabase Auth

### 4. src/pages/Dashboard.tsx
- Painel principal com resumo financeiro
- Cards com totais (gastos, contas pagas/pendentes, saldo)
- Gráficos de gastos por categoria e evolução mensal
- Alertas de orçamento

### 5. src/pages/Transactions.tsx
- CRUD completo de transações/contas
- Tabela com filtros (mês, status, categoria)
- Modal para adicionar/editar transações
- Indicadores visuais de vencimento

### 6. src/pages/Budget.tsx
- Configuração de orçamento mensal
- Visualização de progresso
- Alertas quando ultrapassar limite

### 7. src/pages/Reports.tsx
- Relatórios mensais
- Exportação para PDF e Excel
- Gráficos detalhados

### 8. src/components/Navbar.tsx
- Navegação principal
- Menu de perfil
- Logout

## Funcionalidades por Página

### Login/Cadastro
- [x] Formulário de login
- [x] Formulário de cadastro
- [x] Validação de campos
- [x] Integração com Supabase Auth

### Dashboard
- [x] Resumo do mês atual
- [x] Gráfico de gastos por categoria (pizza)
- [x] Gráfico de evolução mensal (linha)
- [x] Cards de resumo (total gasto, pagas, pendentes)
- [x] Alerta de orçamento

### Transações
- [x] Listar todas as transações
- [x] Adicionar nova transação
- [x] Editar transação
- [x] Excluir transação
- [x] Filtros (mês, status, categoria)
- [x] Indicador de vencimento próximo

### Orçamento
- [x] Definir limite mensal
- [x] Visualizar progresso
- [x] Histórico de orçamentos

### Relatórios
- [x] Gerar relatório mensal
- [x] Exportar PDF
- [x] Exportar Excel
- [x] Gráficos detalhados

## Banco de Dados Supabase

### Tabelas necessárias:
1. **transactions** (id, user_id, title, amount, category, due_date, status, notes, created_at)
2. **budgets** (id, user_id, month, year, limit_amount, created_at)
3. **users** (gerenciado pelo Supabase Auth)

## Categorias padrão
- Aluguel
- Luz
- Água
- Internet
- Alimentação
- Transporte
- Lazer
- Saúde
- Educação
- Outros

## Design
- Cores: Azul (#3B82F6), Cinza (#6B7280), Branco (#FFFFFF)
- Layout responsivo
- Navbar superior
- Sidebar lateral no dashboard