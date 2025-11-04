# Sistema de Gerenciamento Financeiro Pessoal

Um sistema completo de gerenciamento fiscal e financeiro pessoal desenvolvido com Next.js (React) e Supabase.

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI**: Shadcn-UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Gráficos**: Recharts
- **Exportação**: jsPDF + XLSX

## ✨ Funcionalidades

### 🔐 Autenticação
- Cadastro de usuário com nome completo, e-mail e senha
- Login com JWT via Supabase Auth
- Proteção de rotas

### 💰 Controle de Transações
- CRUD completo (criar, listar, editar e excluir)
- Campos: título, valor, categoria, data de vencimento, status (pago/pendente), observações
- Filtros por mês, status e categoria
- Indicador visual de contas próximas ao vencimento (3 dias)

### 📊 Dashboard Financeiro
- Resumo do mês atual (gastos totais, contas pagas, pendentes)
- Gráfico de pizza: gastos por categoria
- Gráfico de linha: evolução mensal
- Alerta visual quando ultrapassar o orçamento

### 💵 Orçamento Mensal
- Definição de limite de orçamento mensal
- Visualização de progresso em tempo real
- Alertas quando ultrapassar o limite

### 📄 Relatórios
- Geração de relatório financeiro mensal
- Exportação em PDF (jsPDF)
- Exportação em Excel (XLSX)
- Gráficos detalhados por categoria e status

## 🎨 Design

- Layout limpo e moderno
- Cores: Azul (#3B82F6), Verde (#10B981), Laranja (#F59E0B)
- Totalmente responsivo (desktop, tablet e celular)
- Navbar superior com menu de perfil
- Navegação intuitiva

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd shadcn-ui
```

### 2. Instale as dependências
```bash
pnpm install
```

### 3. Configure o Supabase

#### 3.1. Crie um projeto no Supabase
- Acesse [https://app.supabase.com](https://app.supabase.com)
- Crie um novo projeto
- Anote a URL do projeto e a chave anônima (anon key)

#### 3.2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

#### 3.3. Execute o SQL no Supabase

Acesse o SQL Editor no Supabase e execute o seguinte script:

```sql
-- Criar tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar tabela de orçamentos
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, month, year)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_due_date_idx ON transactions(due_date);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets(user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas de segurança para budgets
CREATE POLICY "Users can view their own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);
```

### 4. Inicie o servidor de desenvolvimento
```bash
pnpm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes Shadcn-UI
│   └── Navbar.tsx       # Barra de navegação
├── lib/
│   └── supabase.ts      # Configuração do Supabase
├── pages/
│   ├── Login.tsx        # Página de login/cadastro
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Transactions.tsx # Gerenciamento de transações
│   ├── Budget.tsx       # Controle de orçamento
│   └── Reports.tsx      # Relatórios e exportação
├── types/
│   └── index.ts         # Tipos TypeScript
├── App.tsx              # Componente principal com rotas
└── main.tsx             # Entry point
```

## 📱 Páginas

### Login/Cadastro (`/login`)
- Formulário de login
- Formulário de cadastro
- Validação de campos

### Dashboard (`/dashboard`)
- Resumo financeiro do mês
- Gráficos de gastos
- Cards informativos
- Alertas de orçamento

### Transações (`/transactions`)
- Lista de todas as transações
- Adicionar/editar/excluir transações
- Filtros avançados
- Indicadores de vencimento

### Orçamento (`/budget`)
- Definir limite mensal
- Visualizar progresso
- Resumo de gastos

### Relatórios (`/reports`)
- Seleção de período
- Gráficos detalhados
- Exportação PDF/Excel

## 🎯 Categorias Disponíveis

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

## 🔒 Segurança

- Autenticação JWT via Supabase
- Row Level Security (RLS) no banco de dados
- Proteção de rotas no frontend
- Validação de dados

## 📊 Banco de Dados

### Tabela: transactions
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key para auth.users)
- `title`: TEXT
- `amount`: DECIMAL(10, 2)
- `category`: TEXT
- `due_date`: DATE
- `status`: TEXT ('paid' | 'pending')
- `notes`: TEXT (opcional)
- `created_at`: TIMESTAMP

### Tabela: budgets
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key para auth.users)
- `month`: INTEGER
- `year`: INTEGER
- `limit_amount`: DECIMAL(10, 2)
- `created_at`: TIMESTAMP

## 🚀 Deploy

### Frontend (Vercel)
1. Faça push do código para o GitHub
2. Conecte o repositório no Vercel
3. Configure as variáveis de ambiente
4. Deploy automático

### Backend (Supabase)
- Já está hospedado no Supabase
- Configure as políticas de segurança
- Gerencie o banco de dados pelo painel

## 📝 Comandos Úteis

```bash
# Instalar dependências
pnpm install

# Adicionar nova dependência
pnpm add nome-do-pacote

# Iniciar desenvolvimento
pnpm run dev

# Build para produção
pnpm run build

# Verificar erros
pnpm run lint
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é de uso pessoal para gerenciamento financeiro doméstico.

## 👤 Autor

Desenvolvido com ❤️ para facilitar o controle financeiro pessoal.

## 🐛 Problemas Conhecidos

Se encontrar algum problema, por favor abra uma issue no repositório.

## 📞 Suporte

Para dúvidas ou suporte, consulte a documentação do Supabase:
- [Documentação Supabase](https://supabase.com/docs)
- [Shadcn-UI](https://ui.shadcn.com)
- [Recharts](https://recharts.org)