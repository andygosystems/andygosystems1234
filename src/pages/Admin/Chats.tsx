import React, { useState } from 'react';
import { MessageSquare, Calendar, User, Clock, Trash2 } from 'lucide-react';
import { useChat, ChatSession } from '../../context/ChatContext';

const AdminChats: React.FC = () => {
  const { allSessions, getStats, deleteSession } = useChat();
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const stats = getStats();

  // Filter sessions based on search
  const filteredSessions = allSessions.filter(session => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return true;
    const hasMatchingMessage = session.messages.some(m => m.text.toLowerCase().includes(searchLower));
    const nameMatch = session.userName?.toLowerCase().includes(searchLower);
    const phoneMatch = session.userPhone?.toLowerCase().includes(searchLower);
    return session.id.toLowerCase().includes(searchLower) || hasMatchingMessage || nameMatch || phoneMatch;
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      deleteSession(id);
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} chat session(s)?`)) {
      selectedIds.forEach(id => {
        deleteSession(id);
        if (selectedSession?.id === id) {
          setSelectedSession(null);
        }
      });
      setSelectedIds(new Set());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Chat Logs</h1>
          <p className="text-muted-foreground">Review conversations with the AI Assistant</p>
        </div>
        <div className="flex items-center gap-4 bg-card p-2 rounded-sm border border-border">
          <div className="flex items-center gap-2 px-3 border-r border-border">
            <span className="text-2xl font-bold text-primary">{stats.totalSessions}</span>
            <span className="text-xs uppercase font-bold text-muted-foreground">Sessions</span>
          </div>
          <div className="flex items-center gap-2 px-3">
            <span className="text-2xl font-bold text-blue-500">{stats.totalMessages}</span>
            <span className="text-xs uppercase font-bold text-muted-foreground">Messages</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        
        {/* Sessions List */}
        <div className="bg-card border border-border rounded-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex justify-between items-center gap-2">
               {selectedIds.size > 0 ? (
                 <button 
                    onClick={handleBulkDelete}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-4 rounded-sm transition-colors flex items-center justify-center gap-2"
                 >
                    <Trash2 className="w-4 h-4" /> Delete ({selectedIds.size})
                 </button>
               ) : (
                 <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Conversations</h2>
               )}
            </div>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-input border border-input rounded-sm text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {filteredSessions.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No chat sessions found.
              </div>
            ) : (
              filteredSessions.map(session => (
                <div key={session.id} className="flex gap-2">
                 <div className="pt-4 pl-2">
                   <input 
                      type="checkbox" 
                      checked={selectedIds.has(session.id)}
                      onChange={() => toggleSelection(session.id)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                   />
                 </div>
                <button
                  onClick={() => setSelectedSession(session)}
                  className={`group flex-1 text-left p-4 rounded-sm border transition-all ${
                    selectedSession?.id === session.id
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'bg-background border-transparent hover:bg-muted'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-bold text-sm block text-foreground">
                           {session.userName ? session.userName : `Guest ${session.id.substring(0, 4)}`}
                        </span>
                        {session.userPhone && (
                           <span className="text-[10px] text-muted-foreground block">{session.userPhone}</span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(session.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         handleDelete(session.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 pl-10">
                    {session.messages[session.messages.length - 1]?.text || "No messages"}
                  </p>
                </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Detail */}
        <div className="lg:col-span-2 bg-card border border-border rounded-sm flex flex-col overflow-hidden">
          {selectedSession ? (
            <>
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">
                      {selectedSession.userName || `Guest ${selectedSession.id.substring(0, 6)}`}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {selectedSession.userPhone && (
                        <a href={`tel:${selectedSession.userPhone}`} className="hover:text-primary transition-colors">
                          {selectedSession.userPhone}
                        </a>
                      )}
                      <span>Started: {formatDate(selectedSession.startTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground px-3 py-1 bg-muted rounded-full">
                    {selectedSession.messages.length} messages
                  </div>
                  <button 
                    onClick={() => handleDelete(selectedSession.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete Chat Session"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5">
                {selectedSession.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`
                      max-w-[80%] p-4 rounded-lg text-sm shadow-sm
                      ${msg.isBot 
                        ? 'bg-card border border-border text-foreground rounded-tl-none' 
                        : 'bg-primary text-primary-foreground rounded-tr-none'
                      }
                    `}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      <div className={`text-[10px] mt-2 flex items-center gap-1 ${msg.isBot ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {msg.isBot && <span className="uppercase font-bold tracking-wider ml-2">AI Assistant</span>}
                      </div>
                      {msg.isAction && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Action Triggered
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a chat session to view history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChats;