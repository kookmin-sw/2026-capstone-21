import { useState, useEffect } from 'react';
import { getChatHistory } from '../../api/chatHistory';

interface ChatLog {
  id: number;
  conversation_id: number;
  question: string;
  answer: string | null;
  question_type: string;
  created_at: string;
}

export function ChatHistory() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setLoading(false);
      return;
    }
    getChatHistory(Number(userId))
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-500">로딩 중...</div>;
  }

  if (!localStorage.getItem('user_id')) {
    return <div className="text-center py-12 text-slate-500">로그인이 필요합니다.</div>;
  }

  if (logs.length === 0) {
    return <div className="text-center py-12 text-slate-500">채팅 기록이 없습니다.</div>;
  }

  // conversation_id별로 그룹핑
  const grouped = logs.reduce<Record<number, ChatLog[]>>((acc, log) => {
    (acc[log.conversation_id] ||= []).push(log);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Chat History</h1>
      <div className="space-y-6">
        {Object.entries(grouped).map(([convId, convLogs]) => (
          <div key={convId} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="text-sm text-slate-400 mb-4">대화 #{convId}</div>
            <div className="space-y-4">
              {convLogs.reverse().map((log) => (
                <div key={log.id} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-purple-100 text-purple-900 px-4 py-2 rounded-xl max-w-[70%] text-sm">
                      {log.question}
                    </div>
                  </div>
                  {log.answer && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-800 px-4 py-2 rounded-xl max-w-[70%] text-sm whitespace-pre-wrap">
                        {log.answer}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-slate-400">
                    {new Date(log.created_at + "Z").toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
