import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut, getCurrentUser } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { User, LogOut, Settings, LayoutDashboard, Receipt, PiggyBank, FileText, Wallet} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || '');
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <PiggyBank className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">FinanceControl</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/monthly-control">
                <Button variant="ghost" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  Controle Mensal
                </Button>
              </Link>
              <Link to="/transactions">
                <Button variant="ghost" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Transações
                </Button>
              </Link>
              <Link to="/budget">
                <Button variant="ghost" className="gap-2">
                  <PiggyBank className="h-4 w-4" />
                  Orçamento
                </Button>
              </Link>
              <Link to="/reports">
                <Button variant="ghost" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Relatórios
                </Button>
              </Link>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">Minha Conta</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}