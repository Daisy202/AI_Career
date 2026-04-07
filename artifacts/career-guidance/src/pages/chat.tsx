import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ChevronLeft, MessageCircle } from "lucide-react";
import { Button, Input } from "@/components/ui-elements";
import { AiText } from "@/components/AiText";
import { useCareerStore } from "@/store/use-career-store";
import { useSendChatMessage } from "@workspace/api-client-react";
import type { ChatMessage } from "@workspace/api-client-react";

const API = "/api";

export default function ChatPage() {
  const { user, profile, setProfile, clearProfile } = useCareerStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your AI Career Advisor. Ask me about careers, universities, or study requirements in Zimbabwe." }
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<{ id: number; title?: string | null; createdAt: string }[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mutate, isPending } = useSendChatMessage({
    mutation: {
      onSuccess: (data: { message: string; suggestions?: string[]; sessionId?: number }) => {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
        if (data.sessionId) setSessionId(data.sessionId);
      }
    }
  });

  useEffect(() => {
    if (user) {
      fetch(`${API}/profile`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => { if (p) setProfile(p); })
        .catch(() => {});
      fetch(`${API}/chat/sessions`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then(setSessions)
        .catch(() => setSessions([]));
    } else {
      clearProfile();
    }
  }, [user, setProfile, clearProfile]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages, isPending]);

  const startNewChat = () => {
    setMessages([{ role: "assistant", content: "Hi! I'm your AI Career Advisor. Ask me about careers, universities, or study requirements in Zimbabwe." }]);
    setSessionId(null);
    setShowSessions(false);
  };

  const loadSession = async (id: number) => {
    const data = await fetch(`${API}/chat/sessions/${id}`, { credentials: "include" }).then((r) => r.json());
    const msgs = data.messages ?? [];
    setMessages(msgs.length ? msgs as ChatMessage[] : [{ role: "assistant", content: "Start the conversation!" }]);
    setSessionId(id);
    setShowSessions(false);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isPending) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);

    const history = newMessages.slice(0, -1);
    mutate({
      data: {
        message: userMsg,
        history,
        studentProfile: profile || undefined,
        ...(sessionId ? { sessionId } : {}),
      } as { message: string; history?: ChatMessage[]; studentProfile?: unknown; sessionId?: number },
    });
  };

  const defaultSuggestions = [
    "What careers suit Maths and Art?",
    "How do I become a Software Engineer?",
    "What A-Levels for Medicine?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#e5ddd5] min-h-0">
      {/* WhatsApp-style header - fixed */}
      <header className="flex items-center gap-3 px-4 sm:px-5 lg:px-6 py-3 bg-[#075e54] text-white shadow-lg shrink-0">
        {showSessions ? (
          <button onClick={() => setShowSessions(false)} className="p-2 -ml-2 rounded-full hover:bg-white/20">
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : user && sessions.length > 0 ? (
          <button onClick={() => setShowSessions(true)} className="p-2 -ml-2 rounded-full hover:bg-white/20">
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : null}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg truncate">AI Career Advisor</h1>
          <p className="text-xs text-white/80 truncate">Career guidance for Zimbabwe</p>
        </div>
      </header>

      {/* Session list sidebar */}
      {showSessions && user && (
        <div className="absolute left-0 top-[72px] bottom-[100px] w-72 bg-white border-r shadow-xl z-10 flex flex-col min-h-0">
          <div className="p-3 border-b">
            <Button size="sm" className="w-full" onClick={startNewChat}>
              <MessageCircle className="w-4 h-4 mr-2" /> New chat
            </Button>
          </div>
          <div className="divide-y flex-1 min-h-0 overflow-y-auto">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 ${sessionId === s.id ? "bg-primary/10" : ""}`}
              >
                <span className="text-sm font-medium block truncate" title={s.title ?? undefined}>
                  {s.title || new Date(s.createdAt).toLocaleDateString() || "New chat"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat area - only this scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-4 py-2 shadow-md ${
                msg.role === "user"
                  ? "bg-[#dcf8c6] rounded-tr-none"
                  : "bg-white rounded-tl-none"
              }`}
            >
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                {msg.role === "assistant" ? <AiText text={msg.content} /> : msg.content}
              </p>
              <p className={`text-[11px] text-muted-foreground mt-1 ${msg.role === "user" ? "text-right" : ""}`}>
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-md flex gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - fixed footer */}
      <div className="p-3 bg-[#f0f2f5] border-t shrink-0">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {defaultSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="text-xs font-medium px-3 py-1.5 bg-white hover:bg-[#dcf8c6] rounded-full border border-[#e0e0e0]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-2xl bg-white border-0 shadow-sm h-12"
            disabled={isPending}
          />
          <Button type="submit" size="icon" className="rounded-full h-12 w-12 bg-[#075e54] hover:bg-[#054d44]" disabled={!input.trim() || isPending}>
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
