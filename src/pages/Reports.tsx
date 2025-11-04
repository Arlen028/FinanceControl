import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Transaction } from '@/types';
import { toast } from 'sonner';
import { Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

interface CategoryData {
  name: string;
  value: number;
}

interface StatusData {
  name: string;
  value: number;
}

export default function Reports() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth]);

  const loadTransactions = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const [year, month] = selectedMonth.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(date), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar transações';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const categoryData: CategoryData[] = transactions.reduce((acc: CategoryData[], transaction) => {
    const existing = acc.find(item => item.name === transaction.category);
    if (existing) {
      existing.value += transaction.amount;
    } else {
      acc.push({ name: transaction.category, value: transaction.amount });
    }
    return acc;
  }, []);

  const statusData: StatusData[] = [
    {
      name: 'Pago',
      value: transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0),
    },
    {
      name: 'Pendente',
      value: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
    },
  ];

  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const paidExpenses = transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
  const pendingExpenses = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório Financeiro', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Período: ${format(new Date(selectedMonth), "MMMM 'de' yyyy", { locale: ptBR })}`, 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Total de Gastos: R$ ${totalExpenses.toFixed(2)}`, 14, 40);
    doc.text(`Contas Pagas: R$ ${paidExpenses.toFixed(2)}`, 14, 46);
    doc.text(`Contas Pendentes: R$ ${pendingExpenses.toFixed(2)}`, 14, 52);

    const tableData = transactions.map(t => [
      t.title,
      t.category,
      `R$ ${t.amount.toFixed(2)}`,
      format(new Date(t.due_date), 'dd/MM/yyyy'),
      t.status === 'paid' ? 'Pago' : 'Pendente',
    ]);

    autoTable(doc, {
      head: [['Título', 'Categoria', 'Valor', 'Vencimento', 'Status']],
      body: tableData,
      startY: 60,
    });

    doc.save(`relatorio-${selectedMonth}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  const exportToExcel = () => {
    const data = transactions.map(t => ({
      Título: t.title,
      Categoria: t.category,
      Valor: t.amount,
      Vencimento: format(new Date(t.due_date), 'dd/MM/yyyy'),
      Status: t.status === 'paid' ? 'Pago' : 'Pendente',
      Observações: t.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transações');

    XLSX.writeFile(wb, `relatorio-${selectedMonth}.xlsx`);
    toast.success('Excel exportado com sucesso!');
  };

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600 mt-2">Visualize e exporte seus dados financeiros</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700">
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selecionar Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = format(date, 'yyyy-MM');
                    const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-2">{transactions.length} transações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Contas Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {paidExpenses.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-2">
                {transactions.filter(t => t.status === 'paid').length} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Contas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">R$ {pendingExpenses.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-2">
                {transactions.filter(t => t.status === 'pending').length} transações
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="value" fill="#3B82F6" name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">Nenhuma transação no período</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">Nenhuma transação no período</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}