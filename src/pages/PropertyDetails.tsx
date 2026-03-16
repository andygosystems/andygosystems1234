import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, Bed, Bath, Square, ArrowLeft, Share, Heart, X, ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useProperty } from '../context/PropertyContext';
import InquiryForm from '../components/CRM/InquiryForm';
import CurrencyCalculator from '../components/CurrencyCalculator';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for Leaflet default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPropertyById, incrementVisits, loading: contextLoading } = useProperty();
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showFullGallery) return;
      
      if (e.key === 'Escape') {
        setShowFullGallery(false);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullGallery]); // Add images.length to dependency if needed, but standard practice usually okay

  // Fetch property and handle analytics
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!contextLoading && id) {
      incrementVisits(id);
      setLoading(false);
    }
  }, [id, contextLoading]);

  const property = id ? getPropertyById(id) : undefined;

  // Conditional Hooks moved below
  
  if (loading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
        <h1 className="text-3xl font-serif text-foreground mb-4">Property Not Found</h1>
        <p className="text-muted-foreground mb-8">The property you are looking for does not exist or has been removed.</p>
        <Link to="/" className="bg-primary text-primary-foreground px-8 py-3 rounded-sm hover:bg-secondary transition-colors uppercase tracking-widest text-sm">
          Return Home
        </Link>
      </div>
    );
  }

  // Ensure amenities has a default value
  const amenities = property.amenities || [
    '24/7 Security', 'Parking', 'Water Supply', 'Electricity'
  ];

  const description = property.description || 'No description available for this property.';
  const images = (property.images && property.images.length > 0) ? property.images : ['/placeholder-property.jpg'];

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowFullGallery(true);
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      
      {/* Fullscreen Gallery Modal */}
      <AnimatePresence>
        {showFullGallery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          >
            <button 
              onClick={() => setShowFullGallery(false)}
              className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>

            <button 
              onClick={prevImage}
              className="absolute left-4 md:left-8 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-50"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button 
              onClick={nextImage}
              className="absolute right-4 md:right-8 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-50"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="w-full h-full p-4 md:p-12 flex items-center justify-center">
              <motion.img 
                key={currentImageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                src={images[currentImageIndex]} 
                alt={`Gallery View ${currentImageIndex + 1}`}
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium tracking-widest">
              {currentImageIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-12">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{property.title}</h1>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2 text-sm md:text-base underline font-medium text-foreground cursor-pointer hover:text-primary transition-colors">
              <MapPin className="w-4 h-4 text-primary" />
              {property.location}
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <button className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-md transition-colors underline">
                <Share className="w-4 h-4" /> Share
              </button>
              <button className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-md transition-colors underline">
                <Heart className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>

        {/* Photo Grid (Airbnb Style) */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[50vh] min-h-[400px] rounded-xl overflow-hidden mb-12">
          {/* Main Large Image */}
          <div 
            className="md:col-span-2 md:row-span-2 relative cursor-pointer group"
            onClick={() => handleImageClick(0)}
          >
            <img 
              src={images[0]} 
              alt="Main Property View" 
              className="w-full h-full object-cover transition-opacity duration-300 group-hover:brightness-90" 
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Secondary Images Grid */}
          {images.slice(1, 5).map((img, idx) => (
            <div 
              key={idx} 
              className="relative cursor-pointer group overflow-hidden"
              onClick={() => handleImageClick(idx + 1)}
            >
              <img 
                src={img} 
                alt={`View ${idx + 2}`} 
                className="w-full h-full object-cover transition-opacity duration-300 group-hover:brightness-90" 
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}

          {/* Show All Photos Button */}
          <button 
            onClick={() => setShowFullGallery(true)}
            className="absolute bottom-4 right-4 bg-background/90 hover:bg-background text-foreground text-sm font-medium px-4 py-2 rounded-lg border border-border shadow-sm flex items-center gap-2 transition-all"
          >
            <Grid className="w-4 h-4" /> Show all photos
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          {/* Left Column: Property Details */}
          <div className="w-full lg:w-2/3">
            {/* Title & Stats */}
            <div className="border-b border-border pb-8 mb-8">
              <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-2">
                {property.type} property hosted by Krugerr Brendt
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-foreground/80">
                <span>{property.beds} guests</span>
                <span className="text-muted-foreground">•</span>
                <span>{property.beds} bedrooms</span>
                <span className="text-muted-foreground">•</span>
                <span>{property.beds} beds</span>
                <span className="text-muted-foreground">•</span>
                <span>{property.baths} baths</span>
                <span className="text-muted-foreground">•</span>
                <span>{property.sqft} sqft</span>
              </div>
            </div>

            {/* Highlights Section */}
            <div className="border-b border-border pb-8 mb-8 space-y-6">
              <div className="flex gap-4">
                <div className="mt-1"><MapPin className="w-6 h-6 text-foreground" /></div>
                <div>
                  <h3 className="font-bold text-foreground">Great location</h3>
                  <p className="text-muted-foreground text-sm">Located in a prime area with easy access to amenities.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><Bed className="w-6 h-6 text-foreground" /></div>
                <div>
                  <h3 className="font-bold text-foreground">Premium comfort</h3>
                  <p className="text-muted-foreground text-sm">Designed for the ultimate relaxation and luxury experience.</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-border pb-8 mb-8">
               <h2 className="text-xl font-bold text-foreground mb-4">About this place</h2>
              <div className="text-foreground/90 leading-relaxed whitespace-pre-line text-base">
                {description}
              </div>
            </div>

            {/* Amenities */}
            <div className="border-b border-border pb-8 mb-8">
              <h2 className="text-xl font-bold text-foreground mb-6">What this place offers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-3 text-foreground/80">
                    <Square className="w-5 h-5 text-foreground/60" />
                    <span className="text-base">{amenity}</span>
                  </div>
                ))}
              </div>
              <button className="mt-6 border border-foreground/20 rounded-lg px-6 py-3 font-medium hover:bg-muted transition-colors text-sm">
                Show all {amenities.length} amenities
              </button>
            </div>
          </div>

          {/* Right Column: Sticky Booking Card */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-28">
              <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <span className="text-2xl font-bold text-foreground">{formatPrice(property.price)}</span>
                      <span className="text-muted-foreground text-sm"> total</span>
                    </div>
                  </div>

                  <InquiryForm propertyId={property.id} propertyTitle={property.title} />
                  
                  <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground">You won't be charged yet</p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <CurrencyCalculator />
                  </div>
                  
                  <div className="mt-6">
                    {(() => {
                      const agentPhone = '254700000000';
                      const propertyLink = `${window.location.origin}/property/${property.id}`;
                      const message = encodeURIComponent(`Hello! I'm interested in "${property.title}". Here is the link: ${propertyLink}`);
                      const waUrl = `https://wa.me/${agentPhone}?text=${message}`;
                      return (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex justify-center bg-green-500 text-white font-bold py-3 rounded-sm uppercase tracking-wide hover:bg-green-600 transition-colors text-sm"
                        >
                          Contact Agent on WhatsApp
                        </a>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                <span className="underline cursor-pointer">Report this listing</span>
              </div>
            </div>
          </div>

        </div>
        
        {/* Map Section */}
        <div className="mt-12 pt-12 border-t border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">Where you'll be</h2>
          <div className="h-[400px] rounded-xl overflow-hidden border border-border z-0 relative">
             <MapContainer 
               center={property.coords || [-4.0435, 39.6682]} 
               zoom={13} 
               style={{ height: '100%', width: '100%' }}
               scrollWheelZoom={false}
             >
               <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
               />
               <Marker position={property.coords || [-4.0435, 39.6682]}>
                 <Popup>
                   {property.title} <br /> {property.location}
                 </Popup>
               </Marker>
             </MapContainer>
          </div>
          <div className="mt-4 flex items-center gap-2 text-muted-foreground">
             <MapPin className="w-5 h-5" />
             <p className="font-medium">{property.location}</p>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default PropertyDetails;
