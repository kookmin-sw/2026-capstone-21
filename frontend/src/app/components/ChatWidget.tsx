import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, ArrowLeft, Plus, Send, Pencil } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

interface Conversation {
  id: number;
  status: string;
  created_at: number;
  last_message: string;
  name: string;
}

interface Message {
  id: number;
  content: string;
  message_type: number; // 0=incoming(user), 1=outgoing(bot)
  created_at: number;
  sender_type: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localMsgsRef = useRef<Message[]>([]);
  const shouldAutoScroll = useRef(true);

  const userId = localStorage.getItem("user_id") || (() => {
    let guestId = sessionStorage.getItem("guest_id");
    if (!guestId) {
      guestId = `guest_${Date.now()}`;
      sessionStorage.setItem("guest_id", guestId);
    }
    return guestId;
  })();

  const fetchConversations = async () => {
    if (!userId) return;
    const res = await fetch(`${API}/chat/conversations/${userId}`);
    const data = await res.json();
    setConversations(data.conversations || []);
  };

  const fetchMessages = async (convId: number) => {
    const res = await fetch(`${API}/chat/messages/${convId}`);
    const data = await res.json();
    const serverMsgs: Message[] = data.messages || [];
    // 서버 메시지 + 로컬 유저 메시지 합치기
    const serverIds = new Set(serverMsgs.map((m) => m.id));
    const merged = [...serverMsgs, ...localMsgsRef.current.filter((m) => !serverIds.has(m.id))];
    merged.sort((a, b) => a.created_at - b.created_at);
    setMessages(merged);
  };

  useEffect(() => {
    if (open && view === "list") fetchConversations();
  }, [open, view]);

  useEffect(() => {
    if (activeConvId && view === "chat") {
      fetchMessages(activeConvId);
      // 3초마다 폴링
      pollRef.current = setInterval(() => fetchMessages(activeConvId), 3000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [activeConvId, view]);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const openConversation = (convId: number) => {
    setActiveConvId(convId);
    localMsgsRef.current = [];
    setView("chat");
  };

  const handleNewChat = async () => {
    setShowTypeSelect(true);
  };

  const handleTypeSelect = async (questionType: string) => {
    if (!userId) return;
    setShowTypeSelect(false);
    setLoading(true);
    const res = await fetch(`${API}/chat/new/${userId}?question_type=${encodeURIComponent(questionType)}`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.conversation_id) {
      openConversation(data.conversation_id);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvId) return;
    const content = input.trim();
    setInput("");
    shouldAutoScroll.current = true;
    // 낙관적 업데이트
    const localMsg: Message = { id: Date.now(), content, message_type: 0, created_at: Date.now() / 1000, sender_type: "Contact" };
    localMsgsRef.current = [...localMsgsRef.current, localMsg];
    setMessages((prev) => [...prev, localMsg]);
    await fetch(`${API}/chat/send/${activeConvId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, user_id: userId }),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-xl flex items-center justify-center transition"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* 채팅 패널 */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="bg-purple-600 text-white px-4 py-3 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {view === "chat" && (
                  <button onClick={() => { setView("list"); if (pollRef.current) clearInterval(pollRef.current); }}>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <span className="font-semibold text-sm">
                  {view === "list" ? "채팅" : (conversations.find((c) => c.id === activeConvId)?.name || "새로운 채팅")}
                </span>
              </div>
              <button onClick={() => { setOpen(false); if (pollRef.current) clearInterval(pollRef.current); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {!localStorage.getItem("user_id") && (
              <p className="text-xs text-purple-200 mt-1">⚠️ 비로그인 상태 — 탭을 닫으면 대화 기록이 사라집니다</p>
            )}
          </div>

          {/* 대화 목록 */}
          {view === "list" && (
            <div className="flex-1 overflow-y-auto">
              {showTypeSelect ? (
                <div className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">질문 유형을 선택해주세요</p>
                  <button
                    onClick={() => handleTypeSelect("인플루언서 추천")}
                    className="w-full px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-100 transition"
                  >
                    🤖 인플루언서 추천
                  </button>
                  <button
                    onClick={() => handleTypeSelect("사이트 이용 관련")}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    💡 사이트 이용 관련
                  </button>
                  <button
                    onClick={() => setShowTypeSelect(false)}
                    className="w-full text-xs text-slate-400 hover:text-slate-600 mt-2"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleNewChat}
                    disabled={loading}
                    className="w-full px-4 py-3 border-b border-slate-100 flex items-center gap-2 text-purple-600 hover:bg-purple-50 font-semibold text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    {loading ? "생성 중..." : "새 채팅 시작"}
                  </button>
                  {conversations.length === 0 && (
                    <div className="text-center text-slate-400 text-sm py-8">대화가 없습니다</div>
                  )}
                  {conversations.map((conv) => (
                    <div key={conv.id} className="flex items-center border-b border-slate-100">
                      <button
                        onClick={() => openConversation(conv.id)}
                        className="flex-1 px-4 py-3 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-800">{conv.name || "새로운 채팅"}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${conv.status === "open" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                            {conv.status === "open" ? "진행중" : "종료"}
                          </span>
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{conv.last_message}</p>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const newName = prompt("채팅 이름을 입력하세요", conv.name || "새로운 채팅");
                          if (newName && newName.trim()) {
                            fetch(`${API}/chat/conversations/${conv.id}/name`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: newName.trim() }),
                            }).then(() => {
                              setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, name: newName.trim() } : c));
                            });
                          }
                        }}
                        className="px-2 py-3 text-slate-400 hover:text-purple-600 transition"
                        title="이름 수정"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("이 대화를 삭제할까요?")) {
                            fetch(`${API}/chat/conversations/${conv.id}`, { method: "DELETE" })
                              .then(() => setConversations((prev) => prev.filter((c) => c.id !== conv.id)));
                          }
                        }}
                        className="px-2 py-3 text-slate-400 hover:text-red-500 transition"
                        title="삭제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* 채팅창 */}
          {view === "chat" && (
            <>
              <div
                ref={messagesContainerRef}
                onScroll={() => {
                  const el = messagesContainerRef.current;
                  if (el) {
                    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
                    shouldAutoScroll.current = atBottom;
                  }
                }}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.message_type === 0 ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap break-all ${
                      msg.message_type === 0
                        ? "bg-purple-100 text-purple-900"
                        : "bg-slate-100 text-slate-800"
                    }`}>
                      {msg.content.split("\n").map((line, i) => {
                        const linkMatch = line.match(/\[(.+?)\]\((.+?)\)/);
                        if (linkMatch) {
                          return (
                            <a key={i} href={linkMatch[2]} className="block mt-2 px-3 py-2 bg-purple-600 text-white text-center rounded-lg text-xs font-semibold hover:bg-purple-700 transition">
                              {linkMatch[1]}
                            </a>
                          );
                        }
                        return <span key={i}>{line}{"\n"}</span>;
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-slate-200 px-3 py-2 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
