import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { Plus, Trash2, Edit, Calendar, FileText } from 'lucide-react';

const AdminProjects = () => {
  const { projects, deleteProject, loading } = useProject();
  const [deleteStatus, setDeleteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        setDeleteStatus({ type: 'success', message: 'Project deleted successfully.' });
      } catch (e: any) {
        setDeleteStatus({ type: 'error', message: `Failed to delete project: ${e?.message || e}` });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {deleteStatus && (
        <div className={`mb-4 p-4 rounded-sm border text-sm font-medium flex items-start justify-between gap-4 ${
          deleteStatus.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-600'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          <span>{deleteStatus.message}</span>
          <button type="button" onClick={() => setDeleteStatus(null)} className="shrink-0 font-bold opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-foreground">New Projects</h1>
        <Link 
          to="/admin/projects/add" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-sm font-bold uppercase text-xs tracking-wide flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </Link>
      </div>

      <div className="bg-card rounded-sm shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Project</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Completion</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Progress</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No projects found. Add your first project to get started.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-sm overflow-hidden flex-shrink-0">
                          {project.images?.[0] ? (
                            <img src={project.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Img</div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm line-clamp-1">{project.title}</h3>
                          {project.brochureUrl && (
                             <div className="flex items-center gap-1 text-xs text-primary mt-1">
                               <FileText className="w-3 h-3" /> Brochure Available
                             </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{project.location}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.estimatedCompletion).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{project.progress}%</span>
                          {project.autoProgress && <span className="text-primary text-[10px] uppercase">Auto</span>}
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded-sm ${
                        project.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 
                        project.status === 'Under Construction' ? 'bg-blue-500/10 text-blue-500' : 
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/projects/edit/${project.id}`}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(project.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProjects;
