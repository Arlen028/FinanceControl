# Configuração do Supabase - Passo a Passo

Este guia detalha como configurar o backend Supabase para o sistema de gerenciamento financeiro.

## 1. Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Clique em "New Project"
3. Preencha os dados:
   - **Name**: FinanceControl (ou outro nome)
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima
4. Clique em "Create new project"
5. Aguarde a criação do projeto (pode levar alguns minutos)

## 2. Obter Credenciais

1. No painel do projeto, vá em **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: A chave pública (anon key)

## 3. Configurar Variáveis de Ambiente

1. No projeto, crie um arquivo `.env` na raiz:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e adicione suas credenciais:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

## 4. Criar Tabelas no Banco de Dados

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "New query"
3. Cole o seguinte SQL e execute:

```sql
-- ============================================
-- TABELAS
-- ============================================

-- Tabela de transações
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

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, month, year)
);

-- ============================================
-- ÍNDICES (para melhor performance)
-- ============================================

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_due_date_idx ON transactions(due_date);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets(user_id);
CREATE INDEX IF NOT EXISTS budgets_month_year_idx ON budgets(month, year);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE SEGURANÇA - TRANSACTIONS
-- ============================================

-- Usuários podem ver apenas suas próprias transações
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias transações
CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias transações
CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias transações
CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - BUDGETS
-- ============================================

-- Usuários podem ver apenas seus próprios orçamentos
CREATE POLICY "Users can view their own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios orçamentos
CREATE POLICY "Users can insert their own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios orçamentos
CREATE POLICY "Users can update their own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios orçamentos
CREATE POLICY "Users can delete their own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);
```

4. Clique em "Run" para executar o SQL

## 5. Configurar Autenticação

1. Vá em **Authentication** > **Providers**
2. Certifique-se de que **Email** está habilitado
3. Em **Authentication** > **Email Templates**, você pode personalizar os emails (opcional)

## 6. Configurar Email (Opcional)

Por padrão, o Supabase usa emails de teste. Para produção:

1. Vá em **Settings** > **Auth**
2. Configure um provedor SMTP (Gmail, SendGrid, etc.)
3. Ou use o serviço de email do Supabase (plano pago)

## 7. Testar a Conexão

1. Inicie o projeto:
```bash
pnpm run dev
```

2. Acesse `http://localhost:5173`
3. Tente criar uma conta
4. Verifique no painel do Supabase em **Authentication** > **Users** se o usuário foi criado

## 8. Verificar Tabelas

1. Vá em **Table Editor** no Supabase
2. Você deve ver as tabelas:
   - `transactions`
   - `budgets`
3. Crie algumas transações pelo aplicativo
4. Verifique se os dados aparecem nas tabelas

## 9. Políticas de Segurança (RLS)

As políticas já foram criadas no SQL acima. Para verificar:

1. Vá em **Authentication** > **Policies**
2. Selecione a tabela `transactions` ou `budgets`
3. Você deve ver 4 políticas para cada tabela (SELECT, INSERT, UPDATE, DELETE)

## 10. Backup (Recomendado)

Para fazer backup do banco de dados:

1. Vá em **Database** > **Backups**
2. Configure backups automáticos (disponível em planos pagos)
3. Ou use o botão "Download backup" para fazer backup manual

## 🔒 Segurança

### Boas Práticas:

1. **Nunca compartilhe** sua `service_role_key` (chave de serviço)
2. Use apenas a `anon key` no frontend
3. Mantenha as políticas RLS sempre ativas
4. Use senhas fortes para o banco de dados
5. Configure 2FA na sua conta Supabase

### Variáveis de Ambiente:

- ✅ Use `.env` para desenvolvimento local
- ✅ Configure variáveis de ambiente no Vercel/Netlify para produção
- ❌ Nunca faça commit do arquivo `.env` no Git

## 🚀 Deploy

### Frontend (Vercel):

1. Faça push do código para GitHub
2. Conecte o repositório no Vercel
3. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy automático

### Backend (Supabase):

- Já está hospedado! ✅
- Sem necessidade de deploy adicional
- Gerencie pelo painel do Supabase

## 📊 Monitoramento

Para monitorar o uso:

1. Vá em **Settings** > **Usage**
2. Verifique:
   - Database size
   - API requests
   - Storage
   - Bandwidth

## 🆘 Problemas Comuns

### Erro: "Invalid API key"
- Verifique se copiou a `anon key` correta
- Confirme que o arquivo `.env` está na raiz do projeto
- Reinicie o servidor de desenvolvimento

### Erro: "Row Level Security"
- Verifique se as políticas RLS foram criadas
- Confirme que o usuário está autenticado
- Verifique os logs no Supabase

### Erro: "Failed to fetch"
- Verifique a URL do projeto
- Confirme que o projeto está ativo no Supabase
- Verifique sua conexão com a internet

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Reference](https://supabase.com/docs/guides/database/overview)

## ✅ Checklist de Configuração

- [ ] Projeto criado no Supabase
- [ ] Credenciais copiadas (URL + anon key)
- [ ] Arquivo `.env` configurado
- [ ] SQL executado (tabelas criadas)
- [ ] Políticas RLS ativas
- [ ] Autenticação por email habilitada
- [ ] Teste de cadastro realizado
- [ ] Teste de login realizado
- [ ] Transações sendo salvas no banco

---

Pronto! Seu backend Supabase está configurado e pronto para uso! 🎉