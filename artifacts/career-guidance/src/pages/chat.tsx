import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Button, Input, Card } from "@/components/ui-elements";
import { useCareerStore } from "@/store/use-career-store";
import { useSendChatMessage } from "@workspace/api-client-react";
import type { ChatMessage, ChatMessageRole } from "@workspace/api-client-react";

export default function ChatPage() {
  const profile = useCareerStore(s => s.profile);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I'm your Gemini AI Career Advisor. How can I help you shape your future today?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mutate, isPending } = useSendChatMessage({
    mutation: {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isPending) return;

    const userMsg = input.trim();
    setInput("");
    
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);

    // Filter out the first generic greeting from history if needed, or pass all
    const history = newMessages.slice(0, -1);
    
    mutate({
      data: {
        message: userMsg,
        history,
        studentProfile: profile || undefined
      }
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const defaultSuggestions = [
    "What careers suit someone good at Maths and Art?",
    "How do I become a Software Engineer in Zimbabwe?",
    "What A-Level subjects are best for Medicine?"
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar context info */}
      <div className="w-full md:w-80 bg-white border-r border-border/50 p-6 hidden md:block">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 p-1 mb-4">
            <img 
              src={`${import.meta.env.BASE_URL}images/chatbot-avatar.png`} 
              alt="AI Advisor" 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold">Gemini Advisor</h2>
          <p className="text-sm text-muted-foreground">Expert in Zimbabwe career paths & education</p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-sm mb-2 flex items-center"><User className="w-4 h-4 mr-2" /> Current Profile</h3>
          {profile ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Interests:</strong> {profile.interests.slice(0,2).join(', ')}...</p>
              <p><strong className="text-foreground">Subjects:</strong> {profile.subjects.length} selected</p>
              <p><strong className="text-foreground">Type:</strong> {profile.personalityType}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No profile loaded. The AI will give general advice.</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-secondary/10'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6 text-secondary" />}
              </div>
              <div className={`p-4 rounded-2xl max-w-[85%] ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md' 
                  : 'bg-white border border-border shadow-sm rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          
          {isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4 max-w-4xl mx-auto">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6 text-secondary" />
              </div>
              <div className="p-5 rounded-2xl bg-white border border-border flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-border/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {defaultSuggestions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSuggestionClick(s)}
                    className="text-xs font-semibold px-3 py-1.5 bg-muted hover:bg-primary/10 hover:text-primary transition-colors rounded-full border border-border"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSend} className="relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Gemini anything about careers..."
                className="pr-14 h-14 text-base rounded-2xl shadow-sm"
                disabled={isPending}
              />
              <Button 
                type="submit" 
                size="icon" 
                variant="default"
                className="absolute right-1 h-12 w-12 rounded-xl"
                disabled={!input.trim() || isPending}
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <div className="text-center mt-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-accent" /> AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
