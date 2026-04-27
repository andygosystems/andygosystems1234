import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedProperties from '../components/FeaturedProperties';
import MapSearch from '../components/MapSearch';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Krugerr Brendt Real Estate Kenya"
        description="Welcome to Krugerr Brendt Real Estate — Kenya's premier luxury property agency. Discover exclusive homes, villas, and apartments for sale and rent in Nairobi, Mombasa, and premium locations across Kenya."
        canonical="/"
        type="website"
      />
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <FeaturedProperties />
        <MapSearch />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
