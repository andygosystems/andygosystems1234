import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, Phone, RefreshCw, Trash2, History, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import { useProperty, ExtendedProperty } from '../context/PropertyContext';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentSessionId, startSession, addMessage, sessions, setCurrentSessionId } = useChat();
  const { properties } = useProperty();
  const [input, setInput] = useState("");
  const [contextProperty, setContextProperty] = useState<ExtendedProperty | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const [registration, setRegistration] = useState<{ name: string; phone: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current session messages or start new one
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Reset registration on refresh (if user manually refreshes)
  // But component mount means refresh or navigation. 
  // We want to force re-registration if it's a new session.
  
  useEffect(() => {
    // If no session ID, user is definitely not registered for this "session"
    if (!currentSessionId) {
       setRegistration(null);
    } else {
       // If there is a session, check if it has user details
       const session = sessions.find(s => s.id === currentSessionId);
       if (session?.userName && session?.userPhone) {
         setRegistration({ name: session.userName, phone: session.userPhone });
       }
    }
  }, [currentSessionId, sessions]);

  // Initialize chat on first load if no session
  // REMOVED: We don't want to auto-start chat. We want to wait for registration.
  // useEffect(() => {
  //   if (!currentSessionId) {
  //     startNewChat();
  //   }
  // }, [currentSessionId]);

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;

    if (name && phone) {
      const id = await startSession(name, phone);
      setRegistration({ name, phone });
      setViewMode('chat');
      await addMessage(id, `Hello ${name}! Welcome to Krugerr Brendt. I'm your luxury real estate assistant. How can I help you find your dream property today?`, true);
    }
  };

  const startNewChat = async () => {
    if (registration) {
        const id = await startSession(registration.name, registration.phone);
        setContextProperty(null);
        setViewMode('chat');
        await addMessage(id, `Hello ${registration.name}! How can I help you further?`, true);
    } else {
        setRegistration(null);
    }
  };

  // Agent's WhatsApp numbers
  const WHATSAPP_NUMBER = "254782180777"; // Primary: +254 782 180777
  const WHATSAPP_NUMBER_2 = "254722707248"; // Secondary: +254 722 707248

  // Control visibility — only auto-open if not already open; never close an active conversation
  useEffect(() => {
    // If on contact page or admin, do not auto-open
    if (location.pathname === '/contact' || location.pathname.startsWith('/admin')) return;

    // Only auto-open if currently closed (don't interrupt an active chat)
    if (isOpen) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const notifyAgent = (msg: string) => {
    const text = encodeURIComponent(`*New Website Inquiry*\n\nUser Message: ${msg}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    window.open(`https://wa.me/${WHATSAPP_NUMBER_2}?text=${text}`, '_blank');
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    // Ensure we have a session
    let sessionId = currentSessionId;
    if (!sessionId) {
      await startNewChat();
      sessionId = currentSessionId; 
    }
    
    // Safety check if session ID is missing
    if (!sessionId && sessions.length > 0) sessionId = sessions[0].id;

    await addMessage(sessionId!, userMsg, false);
    setInput("");

    // Simulate AI response with Smart Logic
    setTimeout(async () => {
      const lowerMsg = userMsg.toLowerCase();
      let responseText = "";
      let isAction = false;
      let propertyId: string | number | undefined = undefined;
      
      // 0. System Commands
      if (lowerMsg === 'clear' || lowerMsg === 'reset' || lowerMsg.includes('new chat')) {
         await startNewChat();
         return;
      }

      // 1. Gratitude & Small Talk
      if (lowerMsg.match(/\b(thanks|thank|thx|cool|great|good|nice|ok|okay)\b/)) {
         if (lowerMsg.includes("thank") || lowerMsg.includes("thx")) {
             responseText = "You're very welcome! Let me know if you'd like to see more properties.";
         } else if (lowerMsg.includes("ok") || lowerMsg.includes("okay")) {
             responseText = "Alright. Is there anything specific you're looking for?";
         } else {
             responseText = "Glad to hear that! How else can I help you today?";
         }
      }
      // 2. Contextual Follow-up (Conversation State)
      else if (contextProperty && (lowerMsg.includes('available') || lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('located') || lowerMsg.includes('where') || lowerMsg.includes('details') || lowerMsg.includes('yes') || lowerMsg.includes('show me'))) {
         if (lowerMsg.includes('available')) {
            responseText = `Yes, ${contextProperty.title} is currently ${contextProperty.status || 'available'}. Would you like to book a viewing?`;
            isAction = true;
         } else if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
            responseText = `The price for ${contextProperty.title} is ${contextProperty.price}.`;
            propertyId = contextProperty.id;
         } else if (lowerMsg.includes('located') || lowerMsg.includes('where')) {
            responseText = `It is located in ${contextProperty.location}.`;
            propertyId = contextProperty.id;
         } else {
            responseText = `Excellent. I can arrange a viewing for ${contextProperty.title}. Click the button to view the full listing or contact us.`;
            isAction = true;
            propertyId = contextProperty.id;
         }
      }
      // 3. Contact / Human Handoff
      else if (lowerMsg.includes("contact") || lowerMsg.includes("agent") || lowerMsg.includes("call") || lowerMsg.includes("whatsapp") || lowerMsg.includes("talk") || lowerMsg.includes("human")) {
        responseText = "I can connect you directly to our agents on WhatsApp for immediate assistance. You can reach us on **+254 782 180777** or **+254 722 707248**. Click the button below to start the chat.";
        isAction = true;
      } 
      // 4. Greeting
      else if (lowerMsg.match(/^(hi|hello|hey|greetings|morning|afternoon|evening)/)) {
        responseText = "Hello! I can help you find properties, check availability, or answer questions about our listings. What are you looking for today?";
      }
      // 5. Property Search (Specific or General)
      else if (lowerMsg.includes("rent") || lowerMsg.includes("sale") || lowerMsg.includes("buy") || lowerMsg.includes("looking for") || lowerMsg.includes("want") || lowerMsg.includes("search") || lowerMsg.includes("find") || lowerMsg.includes("house") || lowerMsg.includes("apartment") || lowerMsg.includes("villa") || lowerMsg.includes("office") || lowerMsg.includes("listing") || lowerMsg.includes("show me") || properties.some(p => lowerMsg.includes(p.title.toLowerCase()))) {
        
        // Filter logic
        const matches = properties.filter(p => {
            const searchStr = `${p.title} ${p.location} ${p.description} ${p.type} ${p.price}`.toLowerCase();
            
            // Exact Title Match
            if (p.title.toLowerCase().includes(lowerMsg) || lowerMsg.includes(p.title.toLowerCase())) return true;
            
            // General Keyword Matching
            let score = 0;
            const keywords = lowerMsg.split(' ');
            keywords.forEach(word => {
                if (word.length > 3 && searchStr.includes(word)) score++;
            });

            // Hard Filters
            if (lowerMsg.includes("rent") && p.type !== 'Rent') return false;
            if ((lowerMsg.includes("sale") || lowerMsg.includes("buy")) && p.type !== 'Sale') return false;
            
            return score > 0;
        });

        // Sort by relevance
        matches.sort((a, b) => {
            const aTitleMatch = lowerMsg.includes(a.title.toLowerCase());
            const bTitleMatch = lowerMsg.includes(b.title.toLowerCase());
            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;
            return 0;
        });

        if (matches.length > 0) {
            const topMatch = matches[0];
            setContextProperty(topMatch);
            propertyId = topMatch.id;
            
            if (matches.length === 1) {
                 responseText = `I found a matching property: **${topMatch.title}** in ${topMatch.location} for ${topMatch.price}.\n\n${topMatch.description?.substring(0, 100)}...\n\nYou can view the details below.`;
            } else {
                 responseText = `I found ${matches.length} properties that might interest you. The best match is **${topMatch.title}** (${topMatch.price}).\n\nWould you like to see more details about this one?`;
            }
        } else {
            // Soft Not Found
            setContextProperty(null);
            responseText = "I currently don't see a property that matches those exact criteria in our online list, but we have off-market options. Could you tell me more about your preferred location or budget?";
        }
      }
      // 6. Capabilities / Help
      else if (lowerMsg.includes("what can you do") || lowerMsg.includes("help")) {
          responseText = "I can help you browse our luxury portfolio, check property prices and availability, or connect you with an agent. Try saying 'Show me villas in Nairobi' or 'I want to rent an apartment'.";
      }
      // 7. "Scan" or "Update" request
      else if (lowerMsg.includes("scan") || lowerMsg.includes("update") || lowerMsg.includes("check")) {
        const count = properties.length;
        responseText = `I've just scanned our live database. We currently have ${count} available listings ready for viewing. You can ask me about specific locations or property types.`;
      }
      // 8. Fallback
      else {
        responseText = "I see. To help me serve you better, could you mention if you're interested in buying, renting, or a specific location? Or feel free to ask to speak with an agent.";
      }

      addMessage(sessionId!, responseText, true, isAction, propertyId).catch(err => console.error(err));
    }, 800);
  };

  // Hide AI Assistant in Admin Routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 bg-card rounded-lg shadow-2xl border border-primary/20 w-80 sm:w-96 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center border-b border-primary/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center border border-background/50">
                  <Bot className="w-5 h-5 text-background" />
                </div>
                <div>
                  <h3 className="text-primary-foreground font-serif text-sm tracking-wide">KB Assistant</h3>
                  <p className="text-primary-foreground/80 text-xs">Live & Connected</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewMode(viewMode === 'chat' ? 'history' : 'chat')}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1"
                  title={viewMode === 'chat' ? "History" : "Back to Chat"}
                >
                  {viewMode === 'chat' ? <History className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </button>
                {/* Removed RefreshCw button as requested */}
                <button 
                  onClick={() => notifyAgent("I would like to speak to an agent.")}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1"
                  title="Connect on WhatsApp"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat/History Area */}
            {viewMode === 'chat' && !registration ? (
               <div className="h-80 p-6 bg-muted/30 flex flex-col justify-center items-center gap-4">
                  <div className="text-center space-y-2 mb-2">
                    <h4 className="font-serif text-lg text-primary">Welcome</h4>
                    <p className="text-xs text-muted-foreground">Please provide your details to start chatting.</p>
                  </div>
                  <form onSubmit={handleRegistrationSubmit} className="w-full space-y-3">
                    <div>
                      <input 
                        name="name"
                        type="text" 
                        required
                        placeholder="Your Name"
                        className="w-full bg-white border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <input 
                        name="phone"
                        type="tel" 
                        required
                        placeholder="Phone Number"
                        className="w-full bg-white border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md text-sm font-medium transition-colors mt-2"
                    >
                      Start Chat
                    </button>
                    <p className="text-[10px] text-center text-muted-foreground/60 pt-2">
                       Your details are secure and used only to assist you.
                    </p>
                  </form>
               </div>
            ) : (
            <div className="h-80 overflow-y-auto p-4 bg-muted/30 flex flex-col gap-4">
              {viewMode === 'chat' ? (
                <>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
                          msg.isBot
                            ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                            : 'bg-primary text-white font-medium rounded-tr-none shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.isAction && (
                        <button
                          onClick={() => notifyAgent(messages[idx-1]?.text || "Inquiry from AI Assistant")}
                          className="mt-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors shadow-sm self-start"
                        >
                          <Phone className="w-3 h-3" />
                          Chat on WhatsApp
                        </button>
                      )}
                      
                      {/* Property Link Button */}
                      {msg.propertyId && (
                        <button
                          onClick={() => {
                             setIsOpen(false);
                             navigate(`/property/${msg.propertyId}`);
                          }}
                          className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors shadow-sm self-start"
                        >
                          View Listing <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">Chat History</h4>
                    {sessions.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No chat history found</div>
                    ) : (
                        sessions.slice().sort((a,b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()).map(session => (
                            <button
                                key={session.id}
                                onClick={() => {
                                    setCurrentSessionId(session.id);
                                    setViewMode('chat');
                                }}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${session.id === currentSessionId ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-white border-gray-200 hover:border-primary/30 hover:shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs text-gray-400">{new Date(session.lastMessageTime).toLocaleDateString()} {new Date(session.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {session.id === currentSessionId && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Active</span>}
                                </div>
                                <p className="text-sm font-medium text-gray-700 truncate">{session.messages.find(m => !m.isBot)?.text || "New Conversation"}</p>
                                <p className="text-xs text-gray-500 truncate mt-1">{session.messages.length} messages</p>
                            </button>
                        ))
                    )}
                </div>
              )}
            </div>
            )}

            {/* Input Area */}
            {registration && viewMode === 'chat' && (
            <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-input border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary-dark text-primary-foreground p-4 rounded-full shadow-lg transition-colors group relative"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute right-0 top-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </motion.button>
      )}
    </div>
  );
};

export default AIAssistant;