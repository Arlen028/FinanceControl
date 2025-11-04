import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Transaction, CATEGORIES } from '@/types';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    due_date: '',
    status: 'pending' as 'paid' | 'pending',
    notes: '',
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filterMonth, filterStatus, filterCategory]);

  const loadTransactions = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar transações';
      toast.error(errorMessage);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filterMonth) {
      filtered = filtered.filter(t => t.due_date.startsWith(filterMonth));
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    setFilteredTransactions(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id: user.id,
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);

        if (error) throw error;
        toast.success('Transação atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('transactions').insert([transactionData]);

        if (error) throw error;
        toast.success('Transação adicionada com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadTransactions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar transação';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      title: transaction.title,
      amount: transaction.amount.toString(),
      category: transaction.category,
      due_date: transaction.due_date,
      status: transaction.status,
      notes: transaction.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);

      if (error) throw error;
      toast.success('Transação excluída com sucesso!');
      loadTransactions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir transação';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      category: '',
      due_date: '',
      status: 'pending',
      notes: '',
    });
    setEditingTransaction(null);
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(parseISO(dueDate), new Date());
  };

  const isNearDue = (dueDate: string, status: string) => {
    if (status === 'paid') return false;
    const days = getDaysUntilDue(dueDate);
    return days >= 0 && days <= 3;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
            <p className="text-gray-600 mt-2">Gerencie suas contas e despesas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Vencimento</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'paid' | 'pending') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  {editingTransaction ? 'Atualizar' : 'Adicionar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Mês</Label>
                <Input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isNearDue(transaction.due_date, transaction.status) && (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                          {transaction.title}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>R$ {transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>{format(parseISO(transaction.due_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                          {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(transaction.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}