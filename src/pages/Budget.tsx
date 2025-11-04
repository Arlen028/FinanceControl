import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Budget, Transaction } from '@/types';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BudgetPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [limitAmount, setLimitAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();

      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', startDate)
        .lte('due_date', endDate);

      setBudget(budgetData);
      setTransactions(transData || []);
      if (budgetData) {
        setLimitAmount(budgetData.limit_amount.toString());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const budgetData = {
        user_id: user.id,
        month: currentMonth,
        year: currentYear,
        limit_amount: parseFloat(limitAmount),
      };

      if (budget) {
        const { error } = await supabase
          .from('budgets')
          .update({ limit_amount: budgetData.limit_amount })
          .eq('id', budget.id);

        if (error) throw error;
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('budgets').insert([budgetData]);

        if (error) throw error;
        toast.success('Orçamento definido com sucesso!');
      }

      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar orçamento';
      toast.error(errorMessage);
    }
  };

  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const budgetLimit = budget?.limit_amount || 0;
  const remaining = budgetLimit - totalExpenses;
  const percentage = budgetLimit > 0 ? (totalExpenses / budgetLimit) * 100 : 0;
  const isOverBudget = totalExpenses > budgetLimit;

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
          <h1 className="text-3xl font-bold text-gray-900">Orçamento Mensal</h1>
          <p className="text-gray-600 mt-2">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="limit">Limite Mensal (R$)</Label>
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="Ex: 3000.00"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  {budget ? 'Atualizar Orçamento' : 'Definir Orçamento'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Limite definido</span>
                  <span className="font-semibold">R$ {budgetLimit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total gasto</span>
                  <span className={`font-semibold ${isOverBudget ? 'text-red-600' : ''}`}>
                    R$ {totalExpenses.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Restante</span>
                  <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    R$ {remaining.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso</span>
                  <span className="font-semibold">{percentage.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(percentage, 100)} className="h-3" />
              </div>

              {isOverBudget && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold">Orçamento ultrapassado!</p>
                    <p>Você excedeu seu limite em R$ {Math.abs(remaining).toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Orçamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {budgetLimit.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-2">Limite mensal definido</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Gasto</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-2">{transactions.length} transações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saldo Restante</CardTitle>
              <DollarSign className={`h-4 w-4 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                R$ {remaining.toFixed(2)}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {isOverBudget ? 'Acima do orçamento' : 'Disponível para gastar'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}