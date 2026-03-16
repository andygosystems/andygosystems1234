import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Home, DollarSign, ChevronDown, ShieldCheck, Fence, Car, Zap, Droplet, Wrench, Sun as SunIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const SmartSearch = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const handleSearch = () => {
    if (activeTab === 'buy') {
      navigate('/buy');
    } else {
      navigate('/rent');
    }
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="bg-card/90 backdrop-blur-md p-4 md:p-6 border border-border shadow-2xl max-w-4xl w-full mx-auto rounded-md md:rounded-sm"
    >
      <div className="flex gap-0 md:gap-4 mb-6 justify-between md:justify-start bg-muted/50 md:bg-transparent p-1 md:p-0 rounded-lg md:rounded-none">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 md:flex-none py-3 md:pb-2 text-sm font-medium tracking-wide uppercase transition-all rounded-md md:rounded-none border-b-0 md:border-b-2 min-h-[44px] flex items-center justify-center ${
            activeTab === 'buy' 
              ? 'bg-background md:bg-transparent shadow-sm md:shadow-none text-foreground md:border-primary' 
              : 'text-muted-foreground md:border-transparent hover:text-foreground'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab('rent')}
          className={`flex-1 md:flex-none py-3 md:pb-2 text-sm font-medium tracking-wide uppercase transition-all rounded-md md:rounded-none border-b-0 md:border-b-2 min-h-[44px] flex items-center justify-center ${
            activeTab === 'rent' 
              ? 'bg-background md:bg-transparent shadow-sm md:shadow-none text-foreground md:border-primary' 
              : 'text-muted-foreground md:border-transparent hover:text-foreground'
          }`}
        >
          Rent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="relative group">
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <select className="w-full pl-10 pr-4 py-3.5 min-h-[48px] bg-input border border-border focus:outline-none focus:border-primary text-base md:text-sm appearance-none cursor-pointer text-foreground font-medium hover:border-primary transition-colors rounded-md md:rounded-sm">
              <option className="bg-card text-foreground">All Locations</option>
              <option className="bg-card text-foreground">Kilifi</option>
              <option className="bg-card text-foreground">Nairobi</option>
              <option className="bg-card text-foreground">Mombasa</option>
              <option className="bg-card text-foreground">Diani</option>
              <option className="bg-card text-foreground">Dubai</option>
              <option className="bg-card text-foreground">London</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="relative group">
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">Property Type</label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <select className="w-full pl-10 pr-4 py-3.5 min-h-[48px] bg-input border border-border focus:outline-none focus:border-primary text-base md:text-sm appearance-none cursor-pointer text-foreground font-medium hover:border-primary transition-colors rounded-md md:rounded-sm">
              <option className="bg-card text-foreground">All Types</option>
              <option className="bg-card text-foreground">Apartment</option>
              <option className="bg-card text-foreground">Villa</option>
              <option className="bg-card text-foreground">Office</option>
              <option className="bg-card text-foreground">Land</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="relative group">
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 ml-1">Price Range</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <select className="w-full pl-10 pr-4 py-3.5 min-h-[48px] bg-input border border-border focus:outline-none focus:border-primary text-base md:text-sm appearance-none cursor-pointer text-foreground font-medium hover:border-primary transition-colors rounded-md md:rounded-sm">
              <option className="bg-card text-foreground">Any Price</option>
              <option className="bg-card text-foreground">Under 10M KES</option>
              <option className="bg-card text-foreground">10M - 50M KES</option>
              <option className="bg-card text-foreground">50M - 100M KES</option>
              <option className="bg-card text-foreground">100M+ KES</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <button 
          onClick={handleSearch}
          className="w-full bg-primary hover:bg-primary-light text-primary-foreground font-bold py-3.5 px-6 min-h-[48px] transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide text-sm btn-shine rounded-md md:rounded-sm shadow-lg md:shadow-none"
        >
          <Search className="w-5 h-5" />
          Search
        </button>
      </div>
      
      <div className="mt-4">
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="text-xs uppercase tracking-widest underline text-muted-foreground hover:text-primary"
        >
          {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
        </button>
      </div>
      
      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-sm p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Verified</h4>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
              <ShieldCheck className="w-4 h-4" /> Verified Agents Only
            </label>
          </div>
          <div className="bg-card border border-border rounded-sm p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Security</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2"><Fence className="w-4 h-4" /> Gated Community</label>
              <label className="flex items-center gap-2"><Zap className="w-4 h-4" /> Electric Fence</label>
              <label className="flex items-center gap-2"><Wrench className="w-4 h-4" /> CCTV</label>
              <label className="flex items-center gap-2"><Car className="w-4 h-4" /> 24/7 Security</label>
            </div>
          </div>
          <div className="bg-card border border-border rounded-sm p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Utilities</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2"><Droplet className="w-4 h-4" /> Borehole Water</label>
              <label className="flex items-center gap-2"><Zap className="w-4 h-4" /> Back-up Generator</label>
              <label className="flex items-center gap-2"><SunIcon className="w-4 h-4" /> Solar Ready</label>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SmartSearch;
