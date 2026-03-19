import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  PlusCircle, 
  MessageSquare, 
  LogOut, 
  Menu,
  X,
  Bot,
  Hammer
} from 'lucide-react';
import { useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/admin/properties', icon: Building2, label: 'All Properties' },
    { path: '/admin/projects', icon: Hammer, label: 'New Projects' },
    { path: '/admin/properties/add', icon: PlusCircle, label: 'Add Property' },
    { path: '/admin/leads', icon: MessageSquare, label: 'Leads Management' },
    { path: '/admin/chats', icon: Bot, label: 'AI Conversations' },
    { path: '/admin/crm', icon: LayoutDashboard, label: 'CRM Analytics' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="lg:hidden fixed top-4 right-4 z-50 bg-secondary text-secondary-foreground p-2 rounded-sm shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border text-card-foreground transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-border">
          <h2 className="font-serif text-xl font-bold tracking-widest">
            KRUGERR<span className="text-primary">.</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Admin Portal</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors text-sm font-medium tracking-wide uppercase ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={() => {
              signOut();
              navigate('/');
            }}
            className="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-muted w-full rounded-sm transition-colors text-sm font-medium tracking-wide uppercase"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-grow">
          {children}
        </div>

        <div className="mt-8 text-center border-t border-border/40 pt-4">
          <p className="text-[10px] text-muted-foreground/60 tracking-wider">
            Built by <a href="https://andygosystems.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-semibold">andygosystems.com</a>
          </p>
        </div>
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
