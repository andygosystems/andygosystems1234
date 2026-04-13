import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Instagram, Mail, X, MessageCircle, PhoneCall, ChevronLeft, ChevronRight } from 'lucide-react';

const NUMBERS = [
  { display: '+254 782 180777', wa: '254782180777', tel: '+254782180777' },
  { display: '+254 722 707248', wa: '254722707248', tel: '+254722707248' },
];

const FloatingSocials = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeNumber, setActiveNumber] = useState<number | null>(null);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    setActiveNumber(null);
  };

  const handleNumberClick = (idx: number) => {
    setActiveNumber(prev => (prev === idx ? null : idx));
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end">
      {/* Toggle tab */}
      <button
        onClick={handleToggle}
        className="bg-primary text-primary-foreground px-2 py-4 rounded-l-lg shadow-xl flex flex-col items-center gap-1 hover:bg-primary/90 transition-colors"
        aria-label={isOpen ? 'Close contacts' : 'Open contacts'}
      >
        {isOpen
          ? <ChevronRight className="w-4 h-4" />
          : <ChevronLeft className="w-4 h-4" />}
        <span className="text-[9px] font-bold uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 mt-1 opacity-80">
          Contact
        </span>
      </button>

      {/* Popup panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="absolute right-10 bg-card border border-border rounded-l-2xl shadow-2xl overflow-hidden w-64"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3 flex justify-between items-center">
              <span className="text-primary-foreground font-serif text-sm tracking-wide font-bold">Get In Touch</span>
              <button
                onClick={handleToggle}
                aria-label="Close contact panel"
                className="text-primary-foreground/80 hover:text-primary-foreground min-w-[40px] min-h-[40px] flex items-center justify-center rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {/* Phone numbers — expandable */}
              {NUMBERS.map((n, idx) => (
                <div key={idx} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => handleNumberClick(idx)}
                    aria-label={`${n.display} — choose call or WhatsApp`}
                    aria-expanded={activeNumber === idx}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/40 hover:bg-muted transition-colors text-left min-h-[52px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-[#25D366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{n.display}</p>
                      <p className="text-[10px] text-muted-foreground">Tap to choose action</p>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${activeNumber === idx ? 'rotate-90' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {activeNumber === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex border-t border-border">
                          <a
                            href={`tel:${n.tel}`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-blue-600 text-xs font-bold border-r border-border"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            Call
                          </a>
                          <a
                            href={`https://wa.me/${n.wa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors text-[#25D366] text-xs font-bold"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Instagram */}
              <a
                href="https://instagram.com/krugerrbrendt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-[#E1306C]/10 hover:border-[#E1306C]/30 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-[#E1306C]/15 flex items-center justify-center shrink-0">
                  <Instagram className="w-4 h-4 text-[#E1306C]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-[#E1306C] transition-colors">Instagram</p>
                  <p className="text-[10px] text-muted-foreground">@krugerrbrendt</p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:info@krugerrbrendt.com"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/30 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Email Us</p>
                  <p className="text-[10px] text-muted-foreground">info@krugerrbrendt.com</p>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingSocials;
