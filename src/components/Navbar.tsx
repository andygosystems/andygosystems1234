import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CurrencySelector from './CurrencySelector';
import { useTheme } from '../context/ThemeContext';
import MobileBottomBar from './MobileBottomBar';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Buy', href: '/buy' },
    { name: 'Rent', href: '/rent' },
    { name: 'New Projects', href: '/new-projects' },
    { name: 'Contact', href: '/contact' },
  ];

  // Text color logic: White on transparent home hero, Gold (Primary) or Black otherwise
  const textColorClass = !scrolled && isHome ? 'text-white' : 'text-foreground';
  // Logo text: White on transparent home hero, Gold otherwise (to ensure "Gold or Black" requirement)
  const logoTextClass = !scrolled && isHome ? 'text-white' : 'text-primary';
  
  const ThemeIcon = () => {
    if (theme === 'light') return <Sun size={20} />;
    return <Moon size={20} />;
  };

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out pt-safe',
          scrolled || !isHome 
            ? 'bg-background/80 backdrop-blur-md py-4 shadow-sm border-b border-border' 
            : 'bg-transparent py-8'
        )}
      >
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Brand: Logo + Text */}
          <Link 
            to="/" 
            className="flex items-center gap-4 group"
          >
            <div className="relative flex items-center justify-center">
              <img 
                src="/logo-gold.png" 
                alt="Krugerr Brendt" 
                className={cn(
                  "h-16 md:h-24 w-auto object-contain transition-all duration-500",
                  scrolled ? "h-12 md:h-16" : ""
                )}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className={cn("hidden text-2xl font-serif tracking-widest border-2 p-2", logoTextClass, !scrolled && isHome ? "border-white" : "border-foreground")}>KB</span>
            </div>
            <div className="flex flex-col items-start">
               <span className={cn("text-lg md:text-xl font-serif tracking-[0.2em] group-hover:text-primary transition-colors uppercase", logoTextClass)}>KRUGERR BRENDT</span>
               <span className="text-[10px] md:text-xs font-medium text-primary tracking-[0.3em] uppercase">Real Estate</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link 
                key={link.name}
                to={link.href} 
                className={cn("text-xs font-medium tracking-widest hover:text-primary transition-colors uppercase", textColorClass)}
              >
                {link.name}
              </Link>
            ))}
            
            <div className={cn("h-4 w-px mx-2", !scrolled && isHome ? "bg-white/20" : "bg-foreground/20")} />
            
            {/* Theme Toggle Dropdown */}
            <div className="relative group">
              <button className={cn("flex items-center gap-2 hover:text-primary transition-colors", textColorClass)}>
                <ThemeIcon />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-1">
                <button onClick={() => setTheme('light')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm">
                  <span className="flex items-center gap-2"><Sun size={14} /> Estate Light</span>
                  {theme === 'light' && <Check size={14} className="text-primary" />}
                </button>
                <button onClick={() => setTheme('dark')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm">
                  <span className="flex items-center gap-2"><Moon size={14} /> Midnight Exec</span>
                  {theme === 'dark' && <Check size={14} className="text-primary" />}
                </button>
                
              </div>
            </div>

            <div className={textColorClass}>
              <CurrencySelector />
            </div>
          </div>

          {/* Mobile Menu Toggle (Only visible if bottom bar is hidden, but usually we hide this if we have bottom bar) 
              Actually, user said "Mobile Menu Overlay" is still needed, and Bottom Bar has "Menu" button.
              So we hide the hamburger here on mobile if we are using the bottom bar for it. 
              But let's keep it consistent. The Bottom Bar is "On mobile ONLY".
              The top navbar on mobile usually just has Logo and maybe User/Profile.
              Let's hide the hamburger in the top navbar for mobile, since it's in the bottom bar.
          */}
          {/* Mobile Menu Toggle */}
          <button 
            className={cn("md:hidden p-2 text-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", textColorClass)}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay (Glassmorphism) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-background/95 flex flex-col items-center justify-center overscroll-none touch-none"
          >
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-6 right-6 p-4 text-foreground hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center z-[10000]"
              aria-label="Close Menu"
            >
              <X size={32} />
            </button>

            <div className="flex flex-col gap-6 text-center w-full px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-3xl font-serif text-foreground hover:text-primary transition-colors py-4 w-full block active:scale-95 duration-200"
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-px w-24 bg-border mx-auto my-4" />

              {/* Mobile Theme Toggle */}
              <div className="flex gap-6 justify-center">
                <button 
                  onClick={() => setTheme('light')} 
                  className={cn("p-4 rounded-full border-2 min-h-[56px] min-w-[56px] flex items-center justify-center transition-all", theme === 'light' ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground")}
                  aria-label="Light Mode"
                >
                  <Sun size={28} />
                </button>
                <button 
                  onClick={() => setTheme('dark')} 
                  className={cn("p-4 rounded-full border-2 min-h-[56px] min-w-[56px] flex items-center justify-center transition-all", theme === 'dark' ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground")}
                  aria-label="Dark Mode"
                >
                  <Moon size={28} />
                </button>
                
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileBottomBar onMenuClick={() => setMobileMenuOpen(true)} />
    </>
  );
};

export default Navbar;
