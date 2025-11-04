import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Transaction, Budget } from '@/types';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

interface CategoryData {
  name: string;
  value: number;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
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

      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date', { ascending: false });

      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();

      setTransactions(transData || []);
      setBudget(budgetData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const paidExpenses = transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
  const pendingExpenses = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const paidCount = transactions.filter(t => t.status === 'paid').length;
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  const budgetPercentage = budget ? (totalExpenses / budget.limit_amount) * 100 : 0;
  const budgetExceeded = budget && totalExpenses > budget.limit_amount;

  const categoryData = transactions.reduce((acc: CategoryData[], transaction) => {
    const existing = acc.find(item => item.name === transaction.category);
    if (existing) {
      existing.value += transaction.amount;
    } else {
      acc.push({ name: transaction.category, value: transaction.amount });
    }
    return acc;
  }, []);

  const monthlyData = [
    { month: 'Jan', value: 0 },
    { month: 'Fev', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Abr', value: 0 },
    { month: 'Mai', value: 0 },
    { month: 'Jun', value: 0 },
    { month: 'Jul', value: 0 },
    { month: 'Ago', value: 0 },
    { month: 'Set', value: 0 },
    { month: 'Out', value: 0 },
    { month: 'Nov', value: 0 },
    { month: 'Dez', value: 0 },
  ];
  monthlyData[currentMonth - 1].value = totalExpenses;

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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600 mt-2">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {budgetExceeded && (
          <Alert className="mb-6 border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Atenção! Você ultrapassou seu orçamento mensal em R$ {(totalExpenses - (budget?.limit_amount || 0)).toFixed(2)}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Gastos</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">R$ {totalExpenses.toFixed(2)}</div>
              {budget && (
                <p className="text-xs text-gray-600 mt-2">
                  {budgetPercentage.toFixed(1)}% do orçamento (R$ {budget.limit_amount.toFixed(2)})
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Contas Pagas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">R$ {paidExpenses.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-2">{paidCount} transações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Contas Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">R$ {pendingExpenses.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-2">{pendingCount} transações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saldo Disponível</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                R$ {budget ? (budget.limit_amount - totalExpenses).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {budget ? 'Orçamento restante' : 'Configure seu orçamento'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">Nenhuma transação registrada</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} name="Gastos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}