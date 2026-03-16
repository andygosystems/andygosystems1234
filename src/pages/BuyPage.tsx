import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import { useProperty } from '../context/PropertyContext';
import { motion } from 'framer-motion';
import KenyaSearchFilters, { defaultFilters, KenyaFilters } from '../components/KenyaSearchFilters';
import LandFilters, { LandFilters as LFilters } from '../components/LandFilters';
import { useState } from 'react';

const BuyPage = () => {
  const { properties } = useProperty();
  const [filters, setFilters] = useState<KenyaFilters>(defaultFilters);
  const [landFilters, setLandFilters] = useState<LFilters>({});
  const saleProperties = properties.filter(p => p.type === 'Sale').filter(p => {
    const text = `${p.title} ${p.location} ${p.description} ${(p.amenities || []).join(' ')}`.toLowerCase();
    // Verified Agents (heuristic): Exclusive Mandate or Verified keyword
    if (filters.verifiedOnly && !text.includes('exclusive mandate') && !text.includes('verified')) return false;
    // Security
    if (filters.security.gatedCommunity && !text.includes('gated')) return false;
    if (filters.security.electricFence && !text.includes('electric fence')) return false;
    if (filters.security.cctv && !text.includes('cctv')) return false;
    if (filters.security.dayNightSecurity && !text.includes('24/7 security') && !text.includes('24h security')) return false;
    // Utilities
    if (filters.utilities.boreholeWater && !text.includes('borehole')) return false;
    if (filters.utilities.backupGenerator && !text.includes('backup generator')) return false;
    if (filters.utilities.solarReady && !text.includes('solar')) return false;
    // Land details (heuristics)
    const isLand = /land|plot/i.test(p.title) || /land|plot/i.test(text);
    if (filters.land.titleDeedReady && !(isLand && text.includes('title deed'))) return false;
    if (filters.land.fenced && !(isLand && text.includes('fenced'))) return false;
    if (filters.land.nearMainRoad && !(isLand && (text.includes('main road') || text.includes('tarmack')))) return false;
    if (filters.land.plotSize !== 'any') {
      const sizeOk = filters.land.plotSize === '1_8_acre'
        ? /1\/8|eighth|0\.125\s?acre/i.test(text)
        : /50x100|50 x 100|50 by 100/i.test(text);
      if (!(isLand && sizeOk)) return false;
    }
    // Diaspora
    if (filters.diaspora.readyForAirbnb && !text.includes('airbnb')) return false;
    if (filters.diaspora.furnished && !text.includes('furnished')) return false;
    if (filters.diaspora.installmentPayment && !(text.includes('installment') || text.includes('payment plan'))) return false;
    // Location Intelligence
    if (filters.locationGroup === 'nairobi_suburbs' && !/kilimani|lavington|karen|westlands|kileleshwa/i.test(p.location)) return false;
    if (filters.locationGroup === 'satellite_towns' && !/ruiru|syokimau|kitengela|ngong|ongata/i.test(p.location)) return false;
    if (filters.locationGroup === 'growth_corridors' && !/vipingo|tatu|konza|thika/i.test(text)) return false;
    if (filters.town !== 'any' && !new RegExp(filters.town, 'i').test(p.location)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 bg-secondary text-secondary-foreground overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
           <img 
             src="https://images.unsplash.com/photo-1600596542815-e32c630bd1ba?q=80&w=2074&auto=format&fit=crop" 
             alt="Background" 
             className="w-full h-full object-cover"
           />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-serif mb-4 tracking-wider text-secondary-foreground"
          >
            Exclusive Portfolio
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto font-light tracking-wide"
          >
            Discover our handpicked collection of premier properties for sale in the world's most sought-after locations.
          </motion.p>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-6 py-16">
        <KenyaSearchFilters value={filters} onChange={setFilters} />
        <div className="h-4" />
        <LandFilters value={landFilters} onChange={setLandFilters} />
        <div className="h-4" />
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setLandFilters(prev => ({ ...prev, plotSize: prev.plotSize === '50x100' ? 'any' : '50x100' }))}
            className={`px-3 py-1 text-xs rounded-sm border ${landFilters.plotSize === '50x100' ? 'bg-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
          >
            50x100
          </button>
          <button
            onClick={() => setLandFilters(prev => ({ ...prev, docReadyTitle: !prev.docReadyTitle }))}
            className={`px-3 py-1 text-xs rounded-sm border ${landFilters.docReadyTitle ? 'bg-green-600 text-white' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
          >
            Ready Title
          </button>
          <button
            onClick={() => setLandFilters(prev => ({ ...prev, verified: !prev.verified }))}
            className={`px-3 py-1 text-xs rounded-sm border ${landFilters.verified ? 'bg-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
          >
            Verified
          </button>
          <button
            onClick={() => setLandFilters(prev => ({ ...prev, controlledDevelopment: !prev.controlledDevelopment }))}
            className={`px-3 py-1 text-xs rounded-sm border ${landFilters.controlledDevelopment ? 'bg-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
          >
            Controlled Development
          </button>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {saleProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PropertyCard property={property} />
            </motion.div>
          ))}
        </div>

        {saleProperties.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-xl text-muted-foreground">No properties found matching your criteria.</h3>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default BuyPage;
