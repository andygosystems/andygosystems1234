import { useEffect, useState } from 'react';
import { Building2, MessageSquare, TrendingUp, Users, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProperty } from '../../context/PropertyContext';
import { useInquiry } from '../../context/InquiryContext';
import { useChat } from '../../context/ChatContext';
import { useVisits } from '../../context/VisitContext';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
  const { getStats: getPropertyStats, loading: propertiesLoading } = useProperty();
  const { getStats: getInquiryStats } = useInquiry();
  const { getStats: getChatStats } = useChat();
  const { getVisitStats } = useVisits();
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase.from('properties').select('id', { count: 'exact', head: true });
        setDbStatus(error ? 'error' : 'connected');
      } catch {
        setDbStatus('error');
      }
    })();
  }, []);

  const propertyStats = getPropertyStats();
  const inquiryStats = getInquiryStats();
  const chatStats = getChatStats();
  const visitStats = getVisitStats();

  const StatCard = ({ title, value, icon: Icon, color, link }: any) => (
    <div className="bg-card p-6 rounded-sm shadow-sm border border-border flex items-start justify-between">
      <div>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-serif font-bold text-foreground">{value}</h3>
        {link && (
          <Link to={link} className="text-primary text-xs font-medium mt-3 inline-block hover:underline">
            View Details &rarr;
          </Link>
        )}
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  if (propertiesLoading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-foreground mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        <StatCard 
          title="Total Properties" 
          value={propertyStats.totalProperties} 
          icon={Building2} 
          color="bg-blue-500"
          link="/admin/properties"
        />
        <StatCard 
          title="Total Visits" 
          value={visitStats.totalVisits} 
          icon={TrendingUp} 
          color="bg-green-500"
          link="#"
        />
        <StatCard 
          title="Total Leads" 
          value={inquiryStats.total} 
          icon={Users} 
          color="bg-purple-500"
          link="/admin/leads"
        />
        <StatCard 
          title="New Inquiries" 
          value={inquiryStats.new} 
          icon={MessageSquare} 
          color="bg-red-500"
          link="/admin/leads"
        />
        <StatCard 
          title="AI Conversations" 
          value={chatStats.totalSessions} 
          icon={Bot} 
          color="bg-cyan-500"
          link="/admin/chats"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-6 rounded-sm shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              to="/admin/properties/add" 
              className="p-4 border border-border rounded-sm hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-center gap-2"
            >
              <div className="bg-primary/10 p-3 rounded-full">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-sm">Add Property</span>
            </Link>
            <Link 
              to="/admin/leads" 
              className="p-4 border border-border rounded-sm hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-center gap-2"
            >
              <div className="bg-primary/10 p-3 rounded-full">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-sm">View Leads</span>
            </Link>
          </div>
        </div>
        
        {/* Recent Activity or Analytics Graph could go here */}
        <div className="bg-card p-6 rounded-sm shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-4">System Status</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center border-b border-border pb-2">
               <span className="text-sm text-muted-foreground">System Version</span>
               <span className="text-sm font-bold">v2.4.0</span>
             </div>
             <div className="flex justify-between items-center border-b border-border pb-2">
               <span className="text-sm text-muted-foreground">Supabase Status</span>
               <span className={`text-sm font-bold ${
                 dbStatus === 'connected' ? 'text-green-500' : dbStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'
               }`}>
                 {dbStatus === 'connected' ? 'Connected' : dbStatus === 'error' ? 'Connection Error' : 'Checking...'}
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-muted-foreground">Last Synced</span>
               <span className="text-sm font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
