import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { useInquiry } from '../context/InquiryContext';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const ContactPage = () => {
  const { addInquiry } = useInquiry();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      addInquiry({
        customer_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message
      });
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error("Failed to send message", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[40vh] bg-secondary flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" 
            alt="Contact Us" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 text-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-serif text-secondary-foreground mb-4 tracking-wider"
          >
            Get in Touch
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-secondary-foreground/80 text-lg tracking-wide"
          >
            We are here to assist you with your luxury real estate needs.
          </motion.p>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full lg:w-1/3 space-y-10"
          >
            <div>
              <h2 className="text-2xl font-serif text-foreground mb-6 border-l-4 border-primary pl-4">Contact Information</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Whether you are looking to buy, sell, or rent, our team of dedicated professionals is ready to provide you with exceptional service.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground uppercase tracking-wider text-sm mb-1">Visit Us</h3>
                    <p className="text-muted-foreground">Bofa Rd.<br/>Kilifi, Kenya</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground uppercase tracking-wider text-sm mb-1">Call Us</h3>
                    <p className="text-muted-foreground flex flex-col gap-1">
                      <a href="tel:+254782180777" className="hover:text-primary transition-colors">+254 782 180777</a>
                      <a href="tel:+254722707248" className="hover:text-primary transition-colors">+254 722 707248</a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground uppercase tracking-wider text-sm mb-1">Email Us</h3>
                    <p className="text-muted-foreground">
                      <a href="mailto:info@krugerrbrendt.com" className="hover:text-primary transition-colors">info@krugerrbrendt.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full lg:w-2/3 bg-card p-8 md:p-10 rounded-lg shadow-lg border border-border"
          >
            <h2 className="text-2xl font-serif text-foreground mb-8">Send a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-input border border-border text-foreground rounded-sm focus:bg-card focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-input border border-border text-foreground rounded-sm focus:bg-card focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-input border border-border text-foreground rounded-sm focus:bg-card focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                    placeholder="+254 700 000 000"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-input border border-border text-foreground rounded-sm focus:bg-card focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                    placeholder="Property Inquiry"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-input border border-border text-foreground rounded-sm focus:bg-card focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground resize-none"
                  placeholder="I'm interested in..."
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 py-3 bg-secondary text-secondary-foreground font-medium tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
                {!isSubmitting && <Send className="w-4 h-4" />}
              </button>

              {submitStatus === 'success' && (
                <div className="p-4 bg-green-50 text-green-700 rounded-sm border border-green-200">
                  Message sent successfully! We will get back to you soon.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 text-red-700 rounded-sm border border-red-200">
                  Failed to send message. Please try again later or contact us directly via phone/email.
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContactPage;
