import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, Bed, Bath, Square, ArrowLeft, Share, Heart, X, ChevronLeft, ChevronRight, Grid, Video, ImageOff } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useProperty } from '../context/PropertyContext';
import InquiryForm from '../components/CRM/InquiryForm';
import PropertyCard from '../components/PropertyCard';
import SEO from '../components/SEO';
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
  const { getPropertyById, incrementVisits, loading: contextLoading, properties } = useProperty();
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
  const images = (property.images && property.images.length > 0) ? property.images : [];
  const hasImages = images.length > 0;
  const customFlags: string[] = (property as any).flags || [];

  const rawPrice = parseFloat(String(property.price).replace(/[^0-9.]/g, '')) || 0;
  const area = property.location.split(',')[0].trim();
  const areaKeyword = area.toLowerCase().split(' ')[0];
  const relatedProperties = (properties || [])
    .filter(p => String(p.id) !== String(id) && p.location.toLowerCase().includes(areaKeyword))
    .slice(0, 3);

  const metaDescription = `${property.beds ? property.beds + '-bed, ' : ''}${property.baths ? property.baths + '-bath ' : ''}${property.type === 'Sale' ? 'property for sale' : 'rental property'} in ${property.location}, Kenya. ${description.substring(0, 115)}`.trim();

  const propertySchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: description.substring(0, 500),
    url: `https://krugerrbrendt.com/property/${property.id}`,
    image: images.slice(0, 5),
    numberOfRooms: property.beds,
    numberOfBathroomsTotal: property.baths,
    ...(property.sqft ? { floorSize: { '@type': 'QuantitativeValue', value: property.sqft, unitCode: 'FTK' } } : {}),
    offers: {
      '@type': 'Offer',
      price: rawPrice,
      priceCurrency: 'KES',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Krugerr Brendt Real Estate', url: 'https://krugerrbrendt.com' }
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.location,
      addressLocality: property.location,
      addressRegion: 'Nairobi',
      addressCountry: 'KE'
    },
    ...(property.coords ? { geo: { '@type': 'GeoCoordinates', latitude: property.coords[0], longitude: property.coords[1] } } : {})
  };

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
      <SEO
        title={property.title}
        description={metaDescription}
        canonical={`/property/${property.id}`}
        image={images[0]}
        type="website"
        schema={propertySchema}
      />
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
              aria-label="Close photo gallery"
              className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-50 min-w-[44px] min-h-[44px]"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>

            <button 
              onClick={prevImage}
              aria-label="Previous photo"
              className="absolute left-4 md:left-8 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-50 min-w-[44px] min-h-[44px]"
            >
              <ChevronLeft className="w-8 h-8" aria-hidden="true" />
            </button>

            <button 
              onClick={nextImage}
              aria-label="Next photo"
              className="absolute right-4 md:right-8 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-50 min-w-[44px] min-h-[44px]"
            >
              <ChevronRight className="w-8 h-8" aria-hidden="true" />
            </button>

            <div className="w-full h-full p-4 md:p-12 flex items-center justify-center">
              <motion.img 
                key={currentImageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                src={images[currentImageIndex]} 
                alt={`${property.title} in ${property.location} — photo ${currentImageIndex + 1} of ${images.length}`}
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium tracking-widest">
              {currentImageIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-12">
        {/* Header Section */}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{property.title}</h1>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <address className="flex items-center gap-2 text-sm md:text-base not-italic underline font-medium text-foreground cursor-pointer hover:text-primary transition-colors">
              <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
              {property.location}
            </address>
            <div className="flex items-center gap-4 text-sm font-medium">
              <button aria-label="Share this listing" className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-md transition-colors underline min-h-[44px]">
                <Share className="w-4 h-4" aria-hidden="true" /> Share
              </button>
              <button aria-label="Save this listing to favourites" className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-md transition-colors underline min-h-[44px]">
                <Heart className="w-4 h-4" aria-hidden="true" /> Save
              </button>
            </div>
          </div>
        </header>

        {/* Custom Flags */}
        {customFlags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {customFlags.map((flag, i) => (
              <span key={i} className="text-[11px] font-bold uppercase px-3 py-1.5 rounded-sm bg-amber-500 text-white tracking-wide">{flag}</span>
            ))}
          </div>
        )}

        {/* Photo Grid (Airbnb Style) */}
        <section aria-label={`Photo gallery for ${property.title}`} className="relative rounded-xl overflow-hidden mb-12">
          {hasImages ? (
            <div className="relative grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[50vh] min-h-[400px]">
              {/* Hero Image */}
              <div className="md:col-span-2 md:row-span-2 relative cursor-pointer group" onClick={() => handleImageClick(0)}>
                <img src={images[0]} alt={`${property.title} in ${property.location} — main view`} decoding="async" className="w-full h-full object-cover transition-opacity duration-300 group-hover:brightness-90" />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </div>
              {/* Secondary Images */}
              {images.slice(1, 5).map((img, idx) => (
                <div key={idx} className="relative cursor-pointer group overflow-hidden" onClick={() => handleImageClick(idx + 1)}>
                  <img src={img} alt={`${property.title} — interior view ${idx + 2}`} loading="lazy" decoding="async" className="w-full h-full object-cover transition-opacity duration-300 group-hover:brightness-90" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </div>
              ))}
              <button onClick={() => setShowFullGallery(true)} aria-label={`View all ${images.length} photos`} className="absolute bottom-4 right-4 bg-background/90 hover:bg-background text-foreground text-sm font-medium px-4 py-2 rounded-lg border border-border shadow-sm flex items-center gap-2 transition-all min-h-[44px]">
                <Grid className="w-4 h-4" aria-hidden="true" /> Show all photos
              </button>
            </div>
          ) : (
            <div className="h-[40vh] min-h-[300px] flex flex-col items-center justify-center bg-muted rounded-xl gap-4">
              <ImageOff className="w-14 h-14 text-muted-foreground/25" />
              <div className="text-center">
                <p className="font-bold text-muted-foreground/60 uppercase tracking-widest text-sm">Photos Coming Soon</p>
                <p className="text-xs text-muted-foreground/40 mt-1">Images will be uploaded shortly</p>
              </div>
            </div>
          )}
        </section>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          {/* Left Column: Property Details */}
          <article className="w-full lg:w-2/3">
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

            {/* Video Section */}
            {(() => {
              const allVideos: string[] = (property as any).video_urls?.length
                ? (property as any).video_urls
                : (property as any).video_url ? [(property as any).video_url] : [];
              if (allVideos.length === 0) return null;
              const renderVideo = (vurl: string, idx: number) => {
                const isYoutube = vurl.includes('youtube.com') || vurl.includes('youtu.be');
                const isVimeo = vurl.includes('vimeo.com');
                if (isYoutube) {
                  const ytId = vurl.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1];
                  return (
                    <div key={idx} className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe src={`https://www.youtube.com/embed/${ytId}`} title={`Property Video ${idx + 1}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
                    </div>
                  );
                }
                if (isVimeo) {
                  const vimeoId = vurl.match(/vimeo\.com\/(\d+)/)?.[1];
                  return (
                    <div key={idx} className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe src={`https://player.vimeo.com/video/${vimeoId}`} title={`Property Video ${idx + 1}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="w-full h-full" />
                    </div>
                  );
                }
                return (
                  <video key={idx} src={vurl} controls className="w-full rounded-xl aspect-video bg-black" preload="metadata" />
                );
              };
              return (
                <div className="border-b border-border pb-8 mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" aria-hidden="true" />
                    {allVideos.length === 1 ? 'Property Video' : `Property Videos (${allVideos.length})`}
                  </h2>
                  <div className="space-y-4">
                    {allVideos.map((vurl, idx) => renderVideo(vurl, idx))}
                  </div>
                </div>
              );
            })()}

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
              <button aria-label={`Show all ${amenities.length} amenities for this property`} className="mt-6 border border-foreground/20 rounded-lg px-6 py-3 font-medium hover:bg-muted transition-colors text-sm min-h-[44px]">
                Show all {amenities.length} amenities
              </button>
            </div>
          </article>

          {/* Right Column: Sticky Booking Card */}
          <aside className="w-full lg:w-1/3" aria-label="Property pricing and contact">
            <div className="sticky top-28">
              <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      {(property as any).price_on_request ? (
                        <span className="text-lg font-serif italic text-muted-foreground">Available upon request</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-foreground">{formatPrice(property.price)}</span>
                          <span className="text-muted-foreground text-sm"> total</span>
                        </>
                      )}
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
                      const agentPhone = '254782180777';
                      const propertyLink = `${window.location.origin}/property/${property.id}`;
                      const message = encodeURIComponent(`Hello! I'm interested in "${property.title}". Here is the link: ${propertyLink}`);
                      const waUrl = `https://wa.me/${agentPhone}?text=${message}`;
                      return (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Contact agent on WhatsApp about ${property.title}`}
                          className="w-full inline-flex justify-center items-center bg-green-500 text-white font-bold py-3 rounded-sm uppercase tracking-wide hover:bg-green-600 transition-colors text-sm min-h-[44px]"
                        >
                          Contact Agent on WhatsApp
                        </a>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span className="underline cursor-pointer">Report this listing</span>
              </div>
            </div>
          </aside>

        </div>
        
        {/* Map Section */}
        <section className="mt-12 pt-12 border-t border-border" aria-labelledby="map-heading">
          <h2 id="map-heading" className="text-xl font-bold text-foreground mb-6">Where you'll be</h2>
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
             <MapPin className="w-5 h-5" aria-hidden="true" />
             <p className="font-medium">{property.location}</p>
          </div>
        </section>

        {/* Related Properties in Same Area */}
        {relatedProperties.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-bold text-foreground mb-1">
              More properties in {area}
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Explore similar listings in {area} and surrounding areas.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProperties.map(p => (
                <PropertyCard key={p.id} property={p as any} />
              ))}
            </div>
          </section>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetails;
