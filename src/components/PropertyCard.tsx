import { useState, MouseEvent } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  type: 'Sale' | 'Rent';
  beds: number;
  baths: number;
  sqft?: number;
  images: string[];
}

const PropertyCard = ({ property }: { property: Property }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const { formatPrice } = useCurrency();
  
  const images = (property.images && property.images.length > 0) ? property.images : ['/placeholder-property.jpg'];
  const infoText = `${property.title} ${property.location}`.toLowerCase();
  const showToday = /on show|open house|viewing today/i.test(infoText);
  const priceReduced = /reduced|discount|offer/i.test(infoText);
  const readyTitle = /title deed/i.test(infoText);
  const verified = /verified/i.test(infoText);

  const nextImage = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      nextImage();
    } else if (info.offset.x > swipeThreshold) {
      prevImage();
    }
  };

  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-card text-foreground border border-border overflow-hidden rounded-sm shadow-sm hover:shadow-xl transition-all duration-300"
      aria-label={`${property.title} in ${property.location} — ${property.type === 'Sale' ? 'For Sale' : 'For Rent'}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <div className="absolute top-2 left-2 flex gap-2 z-10">
          {showToday && (
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-sm bg-blue-600 text-white">On Show Today</span>
          )}
          {priceReduced && (
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-sm bg-red-600 text-white">Price Reduced</span>
          )}
          {readyTitle && (
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-sm bg-green-600 text-white">Ready Title</span>
          )}
          {verified && (
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-sm bg-primary text-primary-foreground">Verified</span>
          )}
        </div>
        {/* Image Carousel */}
        <AnimatePresence initial={false} mode="popLayout">
          <motion.img
            key={currentImage}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            src={images[currentImage]}
            alt={`${property.title} in ${property.location}${images.length > 1 ? ` — photo ${currentImage + 1} of ${images.length}` : ''}`}
            loading="lazy"
            decoding="async"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
          />
        </AnimatePresence>

        {/* Status Badge - Minimal */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-background/90 backdrop-blur-md text-foreground text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest border border-border/50 shadow-sm">
            {property.type}
          </span>
        </div>

        {/* Navigation Arrows - Only visible on hover (Desktop) */}
        <div className="hidden md:flex absolute inset-0 items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
          <button 
            onClick={prevImage}
            aria-label={`Previous photo of ${property.title}`}
            className="pointer-events-auto p-2 bg-background/80 hover:bg-primary hover:text-primary-foreground text-foreground transition-colors backdrop-blur-sm rounded-full shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button 
            onClick={nextImage}
            aria-label={`Next photo of ${property.title}`}
            className="pointer-events-auto p-2 bg-background/80 hover:bg-primary hover:text-primary-foreground text-foreground transition-colors backdrop-blur-sm rounded-full shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* View Details Overlay */}
        <Link 
          to={`/property/${property.id}`}
          className="absolute inset-0 z-10"
          aria-label={`View details for ${property.title} in ${property.location}`}
          draggable={false}
        />
      </div>

      <div className="p-4 md:p-6 relative bg-card">
        <div className="mb-4">
          <h3 className="text-lg font-serif text-foreground tracking-wide mb-1 line-clamp-1 group-hover:text-primary transition-colors">{property.title}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs tracking-widest uppercase">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="truncate">{property.location}</span>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="text-[10px] uppercase px-2 py-1 rounded-sm bg-muted text-foreground">Residential Zoning</span>
          </div>
        </div>
        
        <div className="flex justify-between items-end border-t border-border pt-4">
          <div className="flex gap-4 text-muted-foreground text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-medium">{property.beds}</span> Beds
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-medium">{property.baths}</span> Baths
            </div>
          </div>
          <p className="text-primary font-serif text-lg tracking-wide">{formatPrice(property.price)}</p>
        </div>
      </div>
    </motion.article>
  );
};


export default PropertyCard;
