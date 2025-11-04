import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, DollarSign, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyIncome {
  id: string;
  user_id: string;
  month: number;
  year: number;
  salary: number;
  created_at: string;
}

interface Expense {
  id: string;
  user_id: string;
  month: number;
  year: number;
  title: string;
  amount: number;
  type: 'fixed' | 'variable';
  category: string;
  created_at: string;
}

const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Luz',
  'Água',
  'Internet',
  'Telefone',
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Vestuário',
  'Outros',
];

export default function MonthlyControl() {
  const [income, setIncome] = useState<MonthlyIncome | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [salaryInput, setSalaryInput] = useState('');
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    type: 'fixed' as 'fixed' | 'variable',
    category: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data: incomeData } = await supabase
        .from('monthly_income')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();

      const { data: expensesData } = await supabase
        .from('monthly_expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .order('created_at', { ascending: false });

      setIncome(incomeData);
      setExpenses(expensesData || []);
      if (incomeData) {
        setSalaryInput(incomeData.salary.toString());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const incomeData = {
        user_id: user.id,
        month: currentMonth,
        year: currentYear,
        salary: parseFloat(salaryInput),
      };

      if (income) {
        const { error } = await supabase
          .from('monthly_income')
          .update({ salary: incomeData.salary })
          .eq('id', income.id);

        if (error) throw error;
        toast.success('Salário atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('monthly_income').insert([incomeData]);

        if (error) throw error;
        toast.success('Salário definido com sucesso!');
      }

      setIsIncomeDialogOpen(false);
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar salário';
      toast.error(errorMessage);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        user_id: user.id,
        month: currentMonth,
        year: currentYear,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('monthly_expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast.success('Gasto atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('monthly_expenses').insert([expenseData]);

        if (error) throw error;
        toast.success('Gasto adicionado com sucesso!');
      }

      setIsExpenseDialogOpen(false);
      resetExpenseForm();
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar gasto';
      toast.error(errorMessage);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      amount: expense.amount.toString(),
      type: expense.type,
      category: expense.category,
    });
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) return;

    try {
      const { error } = await supabase.from('monthly_expenses').delete().eq('id', id);

      if (error) throw error;
      toast.success('Gasto excluído com sucesso!');
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir gasto';
      toast.error(errorMessage);
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: '',
      amount: '',
      type: 'fixed',
      category: '',
    });
    setEditingExpense(null);
  };

  const salary = income?.salary || 0;
  const fixedExpenses = expenses.filter(e => e.type === 'fixed').reduce((sum, e) => sum + e.amount, 0);
  const variableExpenses = expenses.filter(e => e.type === 'variable').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = fixedExpenses + variableExpenses;
  const remaining = salary - totalExpenses;
  const percentageUsed = salary > 0 ? (totalExpenses / salary) * 100 : 0;
  const isOverBudget = remaining < 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Controle Mensal de Gastos</h1>
          <p className="text-gray-600 mt-2">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {isOverBudget && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Atenção! Gastos acima do salário</p>
                  <p className="text-sm text-red-700 mt-1">
                    Você gastou R$ {Math.abs(remaining).toFixed(2)} a mais que seu salário este mês.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Salário Mensal</CardTitle>
              <Wallet className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-3">R$ {salary.toFixed(2)}</div>
              <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {income ? 'Alterar Salário' : 'Definir Salário'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      {income ? 'Alterar Salário Mensal' : 'Definir Salário Mensal'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveSalary} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="salary" className="text-base">Salário (R$)</Label>
                      <Input
                        id="salary"
                        type="number"
                        step="0.01"
                        min="0"
                        value={salaryInput}
                        onChange={(e) => setSalaryInput(e.target.value)}
                        placeholder="Ex: 3000.00"
                        className="text-lg h-12"
                        required
                      />
                      <p className="text-sm text-gray-500">Digite o valor do seu salário mensal</p>
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-11 text-base">
                      {income ? 'Atualizar Salário' : 'Definir Salário'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gastos Fixos</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">R$ {fixedExpenses.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-2">
                {expenses.filter(e => e.type === 'fixed').length} itens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gastos Variáveis</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">R$ {variableExpenses.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-2">
                {expenses.filter(e => e.type === 'variable').length} itens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saldo Restante</CardTitle>
              <DollarSign className={`h-4 w-4 ${isOverBudget ? 'text-red-600' : 'text-purple-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-purple-600'}`}>
                R$ {remaining.toFixed(2)}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {percentageUsed.toFixed(1)}% do salário usado
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progresso do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total gasto</span>
                <span className="font-semibold">R$ {totalExpenses.toFixed(2)} de R$ {salary.toFixed(2)}</span>
              </div>
              <Progress value={Math.min(percentageUsed, 100)} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Gastos Fixos</p>
                <p className="font-semibold text-blue-600">R$ {fixedExpenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Gastos Variáveis</p>
                <p className="font-semibold text-orange-600">R$ {variableExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gastos Fixos</CardTitle>
                <CardDescription className="mt-1">Despesas recorrentes mensais</CardDescription>
              </div>
              <Dialog open={isExpenseDialogOpen && expenseForm.type === 'fixed'} onOpenChange={(open) => {
                if (!open) resetExpenseForm();
                setIsExpenseDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setExpenseForm({ ...expenseForm, type: 'fixed' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpense ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveExpense} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Descrição</Label>
                      <Input
                        id="title"
                        value={expenseForm.title}
                        onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                        placeholder="Ex: Aluguel"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (R$)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        placeholder="Ex: 1200.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      {editingExpense ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.filter(e => e.type === 'fixed').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum gasto fixo registrado</p>
                ) : (
                  expenses.filter(e => e.type === 'fixed').map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{expense.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                          <span className="text-sm font-semibold text-blue-600">R$ {expense.amount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gastos Variáveis</CardTitle>
                <CardDescription className="mt-1">Despesas ocasionais do mês</CardDescription>
              </div>
              <Dialog open={isExpenseDialogOpen && expenseForm.type === 'variable'} onOpenChange={(open) => {
                if (!open) resetExpenseForm();
                setIsExpenseDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setExpenseForm({ ...expenseForm, type: 'variable' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpense ? 'Editar Gasto Variável' : 'Novo Gasto Variável'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveExpense} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title-var">Descrição</Label>
                      <Input
                        id="title-var"
                        value={expenseForm.title}
                        onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                        placeholder="Ex: Compras no supermercado"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount-var">Valor (R$)</Label>
                      <Input
                        id="amount-var"
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        placeholder="Ex: 150.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-var">Categoria</Label>
                      <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                      {editingExpense ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.filter(e => e.type === 'variable').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum gasto variável registrado</p>
                ) : (
                  expenses.filter(e => e.type === 'variable').map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{expense.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                          <span className="text-sm font-semibold text-orange-600">R$ {expense.amount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}