import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Download, Calendar, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const NewProjectsPage = () => {
  const { projects, loading } = useProject();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[50vh] flex items-center justify-center bg-secondary overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2031&auto=format&fit=crop" 
            alt="New Projects" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 text-center px-6">
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-serif text-secondary-foreground mb-4"
          >
            New Developments
          </motion.h1>
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-secondary-foreground/80 max-w-2xl mx-auto text-lg"
          >
            Pioneering the future of luxury living with our upcoming architectural masterpieces.
          </motion.p>
        </div>
      </div>

      <main className="flex-grow">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-24">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
             <p className="text-muted-foreground font-light tracking-wide">Loading exclusive projects...</p>
           </div>
        ) : projects.length === 0 ? (
           <div className="py-24 text-center">
             <h2 className="text-2xl font-serif text-muted-foreground">No new projects at the moment.</h2>
             <p className="text-muted-foreground mt-2">Check back soon for upcoming developments.</p>
           </div>
        ) : (
            projects.map((project, index) => (
              <section key={project.id} className="relative py-24 border-b border-border last:border-0">
                <div className="container mx-auto px-6">
                  <div className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}>
                    
                    {/* Image Side */}
                    <motion.div 
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                      className="w-full lg:w-1/2 h-[400px] lg:h-[500px] relative rounded-lg overflow-hidden shadow-2xl group"
                    >
                      {project.images && project.images.length > 0 ? (
                        <img 
                          src={project.images[0]} 
                          alt={project.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                            No Image Available
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                      
                      {/* Status Badge */}
                      <div className="absolute top-6 left-6 bg-background/90 backdrop-blur-md px-4 py-2 rounded-sm shadow-sm border border-border/50">
                        <span className={`text-xs font-bold uppercase tracking-widest ${
                            project.status === 'Completed' ? 'text-green-500' :
                            project.status === 'Under Construction' ? 'text-blue-500' :
                            'text-yellow-500'
                        }`}>
                            {project.status}
                        </span>
                      </div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="w-full lg:w-1/2 space-y-8"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-primary font-medium mb-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm uppercase tracking-wide">{project.location}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">{project.title}</h2>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                          {project.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="bg-card p-6 rounded-sm border border-border shadow-sm">
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Completion Status</span>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-serif font-bold text-primary">{project.progress}%</span>
                                <span className="text-sm text-muted-foreground self-end mb-1">
                                    Target: {new Date(project.estimatedCompletion).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                          </div>
                          {project.status === 'Completed' && (
                              <CheckCircle2 className="w-8 h-8 text-green-500" />
                          )}
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${project.progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-primary"
                          />
                        </div>
                        {project.autoProgress && (
                            <p className="text-[10px] text-muted-foreground mt-2 italic text-right">
                                * Automatically updated based on timeline
                            </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button className="flex-1 bg-primary text-primary-foreground px-8 py-4 rounded-sm font-bold uppercase tracking-wide hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
                          Inquire Now <ArrowRight className="w-4 h-4" />
                        </button>
                        
                        {project.brochureUrl && (
                            <a 
                              href={project.brochureUrl} 
                              download
                              className="flex-1 bg-card border border-border text-foreground px-8 py-4 rounded-sm font-bold uppercase tracking-wide hover:bg-muted transition-all flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Download Brochure
                            </a>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>
            ))
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NewProjectsPage;
