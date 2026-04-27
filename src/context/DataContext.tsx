import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  tags: string[];
  client?: string;
  date?: string;
  liveUrl?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  type: string;
  date: string;
  status: 'new' | 'read' | 'contacted';
}

export interface Analytics {
  totalVisits: number;
  lastVisit: string;
}

export interface AiMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface AiConversation {
  id: string;
  date: string;
  messages: AiMessage[];
}

interface DataContextType {
  projects: Project[];
  inquiries: Inquiry[];
  analytics: Analytics;
  aiConversations: AiConversation[];
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addInquiry: (inquiry: Omit<Inquiry, 'id' | 'date' | 'status'>) => void;
  markInquiryAsRead: (id: string) => void;
  recordVisit: () => void;
  saveAiConversation: (conversation: AiConversation) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialProjects: Project[] = [
  {
    id: '3',
    title: "InnoVetPro",
    category: "Web Applications",
    image: "/innovetpro-screenshot.png",
    description: "A comprehensive Veterinary Management System designed to streamline clinic operations, patient records, appointments, and billing for veterinary practices.",
    tags: ["React", "TypeScript", "DM Sans", "Plus Jakarta Sans", "Veterinary"],
    client: "InnoVetPro",
    date: "March 2025",
    liveUrl: "https://www.innovetpro.com/"
  },
  {
    id: '2',
    title: "Krugerr Brendt International",
    category: "Luxury Real Estate",
    image: "/krugerrbrendt-screenshot.png",
    description: "Curating the World's Finest Properties. A premier platform for exclusive properties in Kenya and international locations.",
    tags: ["React", "Tailwind CSS", "Framer Motion", "Real Estate"],
    client: "Krugerr Brendt",
    date: "February 2026",
    liveUrl: "https://krugerrbrendt.com/"
  },
  {
    id: '1',
    title: "Veterinarians with a Mission Programme",
    category: "Web Applications",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070",
    description: "Veterinarians with a Mission Programme refreshed website. A platform for veterinary professionals to collaborate and manage missions.",
    tags: ["Vite", "TypeScript", "React", "shadcn-ui", "Tailwind CSS"],
    client: "Veterinarians with a Mission programme",
    date: "September 2025",
    liveUrl: "https://kenyavetsmission.org"
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('andygo_projects_v6');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    const saved = localStorage.getItem('andygo_inquiries');
    return saved ? JSON.parse(saved) : [];
  });

  const [analytics, setAnalytics] = useState<Analytics>(() => {
    const saved = localStorage.getItem('andygo_analytics');
    return saved ? JSON.parse(saved) : { totalVisits: 0, lastVisit: new Date().toISOString() };
  });

  const [aiConversations, setAiConversations] = useState<AiConversation[]>(() => {
    const saved = localStorage.getItem('andygo_ai_conversations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('andygo_projects_v6', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('andygo_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem('andygo_analytics', JSON.stringify(analytics));
  }, [analytics]);

  useEffect(() => {
    localStorage.setItem('andygo_ai_conversations', JSON.stringify(aiConversations));
  }, [aiConversations]);

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject = { ...project, id: Date.now().toString() };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updatedProject: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updatedProject } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const addInquiry = (inquiry: Omit<Inquiry, 'id' | 'date' | 'status'>) => {
    const newInquiry: Inquiry = {
      ...inquiry,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'new'
    };
    setInquiries(prev => [newInquiry, ...prev]);
  };

  const markInquiryAsRead = (id: string) => {
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: 'read' } : i));
  };

  const recordVisit = () => {
    // Simple logic: record visit if last visit was more than 1 hour ago (simulated session)
    // Or just increment for now for demo purposes
    const now = new Date();
    const last = new Date(analytics.lastVisit);
    const diff = now.getTime() - last.getTime();
    
    // Only count as new visit if > 1 minute has passed (to prevent refresh spam)
    if (diff > 60000 || analytics.totalVisits === 0) {
      setAnalytics(prev => ({
        totalVisits: prev.totalVisits + 1,
        lastVisit: now.toISOString()
      }));
    }
  };

  const saveAiConversation = (conversation: AiConversation) => {
    setAiConversations(prev => {
      const exists = prev.find(c => c.id === conversation.id);
      if (exists) {
        return prev.map(c => c.id === conversation.id ? conversation : c);
      }
      return [conversation, ...prev];
    });
  };

  return (
    <DataContext.Provider value={{
      projects,
      inquiries,
      analytics,
      aiConversations,
      addProject,
      updateProject,
      deleteProject,
      addInquiry,
      markInquiryAsRead,
      recordVisit,
      saveAiConversation
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
