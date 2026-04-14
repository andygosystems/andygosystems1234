
import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useInquiry } from '../../context/InquiryContext';

interface InquiryFormProps {
  propertyId?: string;
  propertyTitle?: string;
}

const InquiryForm = ({ propertyId, propertyTitle }: InquiryFormProps) => {
  const { addInquiry } = useInquiry();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      await addInquiry({
        customer_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        subject: `Inquiry for ${propertyTitle || 'Property'}`,
        property_id: propertyId
      });
      
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (status === 'success') {
    return (
      <div className="bg-green-500/10 p-8 rounded-sm text-center border border-green-500/20">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-serif text-green-600 dark:text-green-500 mb-2">Inquiry Sent!</h3>
        <p className="text-green-600/80 dark:text-green-500/80 mb-6">Thank you for your interest. Our team will contact you shortly.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="text-green-600 dark:text-green-500 font-bold text-sm uppercase tracking-wide hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 md:p-8 rounded-sm shadow-lg border border-border">
      <h3 className="text-xl font-serif text-foreground mb-1">Inquire Now</h3>
      <p className="text-muted-foreground text-sm mb-6">Interested in this property? Send us a message.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Full Name</label>
          <input
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            type="text"
            className="w-full p-3 border border-input rounded-sm focus:border-primary focus:outline-none text-sm bg-input text-foreground"
            placeholder="Your Name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Email</label>
            <input
              required
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              className="w-full p-3 border border-input rounded-sm focus:border-primary focus:outline-none text-sm bg-input text-foreground"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Phone</label>
            <input
              required
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              type="tel"
              className="w-full p-3 border border-input rounded-sm focus:border-primary focus:outline-none text-sm bg-input text-foreground"
              placeholder="+254 700 000 000"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Message</label>
          <textarea
            required
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full p-3 border border-input rounded-sm focus:border-primary focus:outline-none text-sm bg-input text-foreground"
            placeholder="I am interested in this property..."
          ></textarea>
        </div>

        <button
          disabled={status === 'submitting'}
          type="submit"
          className="w-full bg-secondary hover:bg-primary text-secondary-foreground hover:text-primary-foreground font-medium py-3 px-6 transition-colors duration-300 flex items-center justify-center gap-2 uppercase tracking-wide text-sm disabled:opacity-70"
        >
          {status === 'submitting' ? (
            <span className="animate-pulse">Sending...</span>
          ) : (
            <>
              <Send className="w-4 h-4" /> Send Inquiry
            </>
          )}
        </button>

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
            <AlertCircle className="w-4 h-4" />
            <span>Something went wrong. Please try again.</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default InquiryForm;
