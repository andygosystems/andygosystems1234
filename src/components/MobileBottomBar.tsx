import { Link, useLocation } from 'react-router-dom';
import { Search, Building2, Phone, Menu } from 'lucide-react';

interface MobileBottomBarProps {
  onMenuClick: () => void;
}

const MobileBottomBar = ({ onMenuClick }: MobileBottomBarProps) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border pb-safe">
      <div className="grid grid-cols-4 h-16">
        <Link 
          to="/buy"
          aria-label="Search properties for sale"
          className={`flex flex-col items-center justify-center gap-1 ${isActive('/buy') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Search</span>
        </Link>
        
        <Link 
          to="/new-projects"
          aria-label="New Projects"
          className={`flex flex-col items-center justify-center gap-1 ${isActive('/new-projects') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Projects</span>
        </Link>
        
        <Link 
          to="/contact"
          aria-label="Contact us"
          className={`flex flex-col items-center justify-center gap-1 ${isActive('/contact') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Phone className="w-5 h-5" />
          <span className="text-[10px] font-medium">Contact</span>
        </Link>
        
        <button 
          onClick={onMenuClick}
          aria-label="Open main menu"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomBar;
