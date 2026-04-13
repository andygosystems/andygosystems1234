import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import { useProperty } from '../context/PropertyContext';
import { motion } from 'framer-motion';
import KenyaSearchFilters, { defaultFilters, KenyaFilters } from '../components/KenyaSearchFilters';
import SEO from '../components/SEO';

const RentPage = () => {
  const { properties } = useProperty();
  const [filters, setFilters] = useState<KenyaFilters>(defaultFilters);
  const rentProperties = properties.filter(p => p.type === 'Rent').filter(p => {
    const text = `${p.title} ${p.location} ${p.description} ${(p.amenities || []).join(' ')}`.toLowerCase();
    if (filters.verifiedOnly && !text.includes('exclusive mandate') && !text.includes('verified')) return false;
    if (filters.security.gatedCommunity && !text.includes('gated')) return false;
    if (filters.security.electricFence && !text.includes('electric fence')) return false;
    if (filters.security.cctv && !text.includes('cctv')) return false;
    if (filters.security.dayNightSecurity && !text.includes('24/7 security') && !text.includes('24h security')) return false;
    if (filters.utilities.boreholeWater && !text.includes('borehole')) return false;
    if (filters.utilities.backupGenerator && !text.includes('backup generator')) return false;
    if (filters.utilities.solarReady && !text.includes('solar')) return false;
    if (filters.diaspora.readyForAirbnb && !text.includes('airbnb')) return false;
    if (filters.diaspora.furnished && !text.includes('furnished')) return false;
    if (filters.diaspora.installmentPayment && !(text.includes('installment') || text.includes('payment plan'))) return false;
    if (filters.locationGroup === 'nairobi_suburbs' && !/kilimani|lavington|karen|westlands|kileleshwa/i.test(p.location)) return false;
    if (filters.locationGroup === 'satellite_towns' && !/ruiru|syokimau|kitengela|ngong|ongata/i.test(p.location)) return false;
    if (filters.locationGroup === 'growth_corridors' && !/vipingo|tatu|konza|thika/i.test(text)) return false;
    if (filters.town !== 'any' && !new RegExp(filters.town, 'i').test(p.location)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Luxury Rental Properties in Kenya"
        description={`Browse ${rentProperties.length} premium rental properties in Nairobi, Mombasa, and Kenya’s top locations. Short-term and long-term rentals by Krugerr Brendt Real Estate.`}
        canonical="/rent"
        type="website"
      />
      <Navbar />
      <section className="pt-32 pb-12 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-4 text-secondary-foreground">Luxury Rentals</h1>
          <p className="text-lg text-secondary-foreground/80 max-w-2xl mx-auto font-light tracking-wide">
            Discover our exclusive collection of premium rental properties in Kenya’s most sought-after locations.
          </p>
        </div>
      </section>
      
      <main className="flex-grow container mx-auto px-6 py-16" aria-label="Rental property listings">
        <KenyaSearchFilters value={filters} onChange={setFilters} />
        <div className="h-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {rentProperties.map((property, index) => (
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
      </main>
      <Footer />
    </div>
  );
};

export default RentPage;
