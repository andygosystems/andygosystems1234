import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabaseCrmService } from '../services/supabaseCrmService';

export interface ChatMessage {
  text: string;
  isBot: boolean;
  timestamp: string;
  isAction?: boolean;
  propertyId?: string | number;
  leadId?: string;
}

export interface ChatSession {
  id: string;
  startTime: string;
  lastMessageTime: string;
  messages: ChatMessage[];
  status: 'active' | 'archived';
  userName?: string;
  userPhone?: string;
  leadId?: string;
}

interface ChatContextType {
  sessions: ChatSession[];
  allSessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string) => void;
  startSession: (userName?: string, userPhone?: string) => Promise<string>;
  addMessage: (sessionId: string, text: string, isBot: boolean, isAction?: boolean, propertyId?: string | number) => Promise<void>;
  deleteSession: (sessionId: string) => void;
  getStats: () => { totalSessions: number; totalMessages: number };
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try { return localStorage.getItem('krugerr_current_session_id'); } catch { return null; }
  });
  const inFlight = React.useRef(false);
  const [mySessionIds, setMySessionIds] = useState<string[]>(() => {
    try {
        return JSON.parse(localStorage.getItem('krugerr_my_sessions') || '[]');
    } catch {
        return [];
    }
  });

  const sessions = allSessions.filter(s => mySessionIds.includes(s.id));

  const loadChats = async () => {
    if (inFlight.current) return;
    if (localStorage.getItem('kb_net_busy') === '1') return;
    inFlight.current = true;
    try {
      const data = await api.getChats();
      const mapped = data.map((s: any) => ({
        id: s.id,
        startTime: s.startTime || s.start_time,
        lastMessageTime: s.lastMessageTime || s.last_message_time,
        messages: s.messages || [],
        status: s.status || 'active',
        userName: s.userName,
        userPhone: s.userPhone,
        leadId: s.leadId || s.lead_id
      }));
      setAllSessions(mapped);
    } catch (e) {
      console.error("Failed to load chats", e);
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    loadChats();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'krugerr_chats') {
        loadChats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const pollInterval = setInterval(loadChats, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('krugerr_current_session_id', currentSessionId);
    }
  }, [currentSessionId]);

  const startSession = async (userName?: string, userPhone?: string) => {
    let leadId: string | undefined;
    
    // 1. Register/Identify Lead in Supabase
    if (userName) {
      try {
        const lead = await supabaseCrmService.startChatSession(userName, userPhone);
        leadId = lead.id;
      } catch (err) {
        console.error("Supabase Lead Error:", err);
      }
    }

    const newSessionId = Math.random().toString(36).substr(2, 9);
    const newSession: ChatSession = {
      id: newSessionId,
      startTime: new Date().toISOString(),
      lastMessageTime: new Date().toISOString(),
      messages: [],
      status: 'active',
      userName,
      userPhone,
      leadId
    };

    setAllSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    
    const updatedMySessions = [...mySessionIds, newSessionId];
    setMySessionIds(updatedMySessions);
    localStorage.setItem('krugerr_my_sessions', JSON.stringify(updatedMySessions));
    
    api.startChatSession(newSession).catch(err => console.error("Failed to start session remotely", err));
    
    return newSessionId;
  };

  const addMessage = async (sessionId: string, text: string, isBot: boolean, isAction?: boolean, propertyId?: string | number) => {
    const session = allSessions.find(s => s.id === sessionId);
    const newMessage: ChatMessage = {
      text,
      isBot,
      timestamp: new Date().toISOString(),
      isAction,
      propertyId,
      leadId: session?.leadId
    };

    setAllSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: [...s.messages, newMessage],
          lastMessageTime: new Date().toISOString()
        };
      }
      return s;
    }));

    // 1. Sync to Inbuilt Backend
    api.addChatMessage(sessionId, newMessage).catch(err => console.error("Failed to add message remotely", err));

    // 2. Log to Supabase for AI Tracking
    if (session?.leadId) {
      supabaseCrmService.logMessage({
        lead_id: session.leadId,
        role: isBot ? 'assistant' : 'user',
        content: text,
        metadata: { isAction, propertyId }
      }).catch(err => console.error("Supabase Log Error:", err));
    }
  };


  const deleteSession = (sessionId: string) => {
     setAllSessions(prev => prev.filter(s => s.id !== sessionId));
     api.deleteChatSession(sessionId).catch(err => console.error("Failed to delete session", err));
  };

  const getStats = () => {
    const totalSessions = allSessions.length;
    const totalMessages = allSessions.reduce((acc, session) => acc + session.messages.length, 0);
    return { totalSessions, totalMessages };
  };

  return (
    <ChatContext.Provider value={{ sessions, allSessions, currentSessionId, setCurrentSessionId, startSession, addMessage, deleteSession, getStats }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
