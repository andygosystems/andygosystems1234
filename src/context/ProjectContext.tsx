import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { api } from '../lib/api';

export interface Project {
  id: string;
  title: string;
  location: string;
  description: string;
  images: string[];
  brochureUrl?: string; // URL or base64
  estimatedCompletion: string; // ISO Date string YYYY-MM-DD
  startDate: string; // ISO Date string YYYY-MM-DD (for auto calculation)
  progress: number; // 0-100
  autoProgress: boolean;
  status: 'Planning' | 'Under Construction' | 'Completed';
  createdAt: string;
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const loadData = async () => {
    if (inFlight.current) return;
    if (localStorage.getItem('kb_net_busy') === '1') return;
    inFlight.current = true;
    try {
      if (projects.length === 0) setLoading(true);
      const data = await api.getProjects();
      const normalized = (data || []).map((p: any) => ({
        id: String(p.id),
        title: p.title,
        location: p.location,
        description: p.description,
        images: Array.isArray(p.images) ? p.images : [],
        brochureUrl: p.brochure_url,
        estimatedCompletion: p.estimated_completion,
        startDate: p.start_date,
        progress: p.progress,
        autoProgress: !!p.auto_progress,
        status: p.status,
        createdAt: p.created_at
      }));
      setProjects(normalized);
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  useEffect(() => {
    loadData();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    await api.addProject(project);
    await loadData();
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const current = projects.find(p => p.id === id);
    if (!current) throw new Error('Project not found');
    await api.updateProject(id, { ...current, ...updates });
    await loadData();
  };

  const deleteProject = async (id: string) => {
    await api.deleteProject(id);
    await loadData();
  };

  const getProjectById = (id: string) => {
    return projects.find(p => p.id === id);
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      loading, 
      addProject, 
      updateProject, 
      deleteProject, 
      getProjectById,
      refreshProjects: loadData
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
