import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Users,
  User,
  Plus,
  Trash2,
  Check,
  CheckCheck,
  Sparkles,
  Bot,
  AlertTriangle,
  FileUp,
  Image,
  RefreshCw,
} from "lucide-react";
import { MultiVendorStorage, ChatThread, ChatMessage, Team } from "@/lib/multiVendorStorage";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { toast } from "sonner";

interface InAppChatAndTeamsProps {
  currentUserEmail: string;
  sellerId: string;
  isSuperAdmin: boolean;
}

export function InAppChatAndTeams({
  currentUserEmail,
  sellerId,
  isSuperAdmin,
}: InAppChatAndTeamsProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  // Team creation form
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [tempMembers, setTempMembers] = useState<Array<{ id: string; name: string; role: string }>>(
    [],
  );

  // Ask AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    description: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatData();
  }, [sellerId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeThreadId, threads]);

  const loadChatData = () => {
    const allThreads = MultiVendorStorage.getChatThreads();
    // Enforce data isolation: Sellers only see their own threads & team channels.
    // Super admins see everything.
    const filtered = isSuperAdmin ? allThreads : allThreads.filter((t) => t.sellerId === sellerId);

    setThreads(filtered);
    if (filtered.length > 0 && !activeThreadId) {
      setActiveThreadId(filtered[0].id);
    }

    setTeams(MultiVendorStorage.getTeams(sellerId));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getActiveThread = (): ChatThread | undefined => {
    return threads.find((t) => t.id === activeThreadId);
  };

  // Built-in live messaging
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    const active = getActiveThread();
    if (!active) return;

    const senderName = isSuperAdmin
      ? "إدارة المنصة (سوبر أدمن)"
      : MarketplaceStore.getSellers().find((s) => s.id === sellerId)?.storeName || "بائع";

    const newMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      senderId: isSuperAdmin ? "super_admin" : sellerId,
      senderName,
      senderRole: isSuperAdmin ? "super_admin" : "seller",
      message: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedThreads = MultiVendorStorage.getChatThreads().map((t) => {
      if (t.id === active.id) {
        return {
          ...t,
          messages: [...t.messages, newMsg],
          lastMessageAt: newMsg.timestamp,
        };
      }
      return t;
    });

    MultiVendorStorage.saveChatThreads(updatedThreads);
    setMessageText("");
    loadChatData();

    // Trigger AI Agent automatic reply if command or message directed to bot
    if (
      messageText.toLowerCase().includes("ai") ||
      messageText.includes("يا ذكي") ||
      messageText.startsWith("/")
    ) {
      triggerAISellerAssistant(messageText, active.id);
    }
  };

  // Ask AI command interpreter (The Ask AI Command Center)
  const triggerAISellerAssistant = (cmdText: string, threadId: string) => {
    setAiLoading(true);
    setTimeout(() => {
      let reply = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let action: any = null;

      const norm = cmdText.toLowerCase();

      if (norm.includes("استيراد") || norm.includes("import")) {
        reply =
          "لقد عثرت على 15 منتجاً مرشحاً للاستيراد من متجرك على انستجرام. هل تود استيرادها الآن إلى مستودع الذكاء الاصطناعي كمسودات؟";
        action = {
          type: "import_products",
          description: "استيراد 15 منتجاً من Instagram Shops كمسودات في المستودع الذكي.",
          payload: { count: 15, source: "Instagram Shops" },
        };
      } else if (norm.includes("حذف") || norm.includes("delete")) {
        reply =
          "انتبه! لقد حددت طلب حذف جماعي لكافة المنتجات غير المفعلة بالمستودع. هل تؤكد رغبتك في حذف 3 منتجات نهائياً؟";
        action = {
          type: "bulk_delete",
          description: "حذف جماعي نهائي لـ 3 منتجات تالفة أو مكررة بالمستودع.",
          payload: { count: 3 },
        };
      } else if (norm.includes("تسعير") || norm.includes("price") || norm.includes("عدل")) {
        reply =
          "قمت بمقارنة الأسعار مع المتاجر المنافسة. أقترح زيادة أسعار غرف المعيشة بنسبة 5% لتحقيق هامش ربح أعلى بمقدار 850 جنيهاً. هل أطبق التسعير المقترح؟";
        action = {
          type: "update_pricing",
          description: "تحديث أسعار غرف المعيشة الذكي وزيادتها بنسبة 5%.",
          payload: { category: "غرف المعيشة", increase: 0.05 },
        };
      } else if (norm.includes("نشر") || norm.includes("publish")) {
        reply =
          "الذكاء الاصطناعي قام بتحسين وتجهيز 5 منتجات جديدة كلياً في المستودع. هل تود نشرها مباشرة في المعرض العام للزبائن؟";
        action = {
          type: "bulk_publish",
          description: "نشر جماعي وتفعيل لـ 5 منتجات مجهزة بالكامل من المستودع للعملاء.",
          payload: { count: 5 },
        };
      } else if (norm.includes("تقرير") || norm.includes("report") || norm.includes("تحليل")) {
        reply =
          "📊 تقرير متجرك السريع:\n• المبيعات اليوم: 12,500 ج.م\n• معدل التحويل: 3.2% (ممتاز!)\n• المنتجات الأكثر طلباً: سرير كابتونيه رمادي.\n💡 فرصة تسويقية: قم بإطلاق كود خصم جديد لزيادة نسبة الشراء المتكرر.";
      } else if (norm.includes("فريق") || norm.includes("team")) {
        reply =
          "يمكنك التنسيق مع فريق العمل الخاص بك مباشرة عبر قنوات الدردشة الجماعية المدمجة على اليمين. تم تحسين التواصل الداخلي بنسبة 40%!";
      } else {
        reply =
          "أهلاً بك في مركز الأوامر الذكي (Ask AI)! يمكنني مساعدتك في:\n• استيراد المنتجات (اكتب 'استيراد')\n• تعديل الأسعار وتنشيط الأرباح (اكتب 'تسعير')\n• النشر الجماعي للمسودات (اكتب 'نشر')\n• تحليل وإصدار تقارير المتجر (اكتب 'تقرير')\n• حذف المنتجات غير المرغوبة بأمان.";
      }

      const aiMsg: ChatMessage = {
        id: "msg-ai-" + Date.now(),
        senderId: "ai_assistant",
        senderName: "مستشار المتجر الذكي (AI)",
        senderRole: "super_admin",
        message: reply,
        timestamp: new Date().toISOString(),
      };

      const updated = MultiVendorStorage.getChatThreads().map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            messages: [...t.messages, aiMsg],
            lastMessageAt: aiMsg.timestamp,
          };
        }
        return t;
      });

      MultiVendorStorage.saveChatThreads(updated);
      if (action) {
        setPendingAction(action);
      }
      setAiLoading(false);
      loadChatData();
    }, 1200);
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    toast.success(`تم تنفيذ عملية [${pendingAction.description}] بنجاح وأمان!`);

    // Add success confirmation to thread
    const active = getActiveThread();
    if (active) {
      const confirmMsg: ChatMessage = {
        id: "msg-conf-" + Date.now(),
        senderId: "system",
        senderName: "تأكيد النظام",
        senderRole: "super_admin",
        message: `✅ تم بنجاح: ${pendingAction.description}`,
        timestamp: new Date().toISOString(),
      };

      const updated = MultiVendorStorage.getChatThreads().map((t) => {
        if (t.id === active.id) {
          return { ...t, messages: [...t.messages, confirmMsg] };
        }
        return t;
      });
      MultiVendorStorage.saveChatThreads(updated);
    }
    setPendingAction(null);
    loadChatData();
  };

  // Create Teams
  const handleAddTempMember = () => {
    if (!newMemberName.trim() || !newMemberRole.trim()) {
      toast.error("يرجى ملء اسم العضو ودوره بالفريق");
      return;
    }
    setTempMembers([
      ...tempMembers,
      { id: "mem-" + Date.now(), name: newMemberName, role: newMemberRole },
    ]);
    setNewMemberName("");
    setNewMemberRole("");
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error("يرجى كتابة اسم الفريق");
      return;
    }

    const newTeam: Team = {
      id: "team-" + Date.now(),
      name: newTeamName,
      description: newTeamDesc,
      sellerId,
      members: tempMembers,
    };

    const currentTeams = MultiVendorStorage.getTeams(sellerId);
    MultiVendorStorage.saveTeams(sellerId, [...currentTeams, newTeam]);

    // Automatically create a team channel for this group
    const newChannel: ChatThread = {
      id: "thread-team-" + newTeam.id,
      title: `${newTeam.name} 👥`,
      type: "team_channel",
      sellerId,
      participants: [sellerId, ...tempMembers.map((m) => m.id)],
      messages: [
        {
          id: "m-welcome",
          senderId: "system",
          senderName: "النظام",
          senderRole: "super_admin",
          message: `تم إنشاء مجموعة الدردشة لفريق [${newTeam.name}] بنجاح. أهلاً بكم لتنسيق العمل الداخلي بالمتجر!`,
          timestamp: new Date().toISOString(),
        },
      ],
      lastMessageAt: new Date().toISOString(),
    };

    const currentThreads = MultiVendorStorage.getChatThreads();
    MultiVendorStorage.saveChatThreads([...currentThreads, newChannel]);

    toast.success(`تم إنشاء فريق [${newTeam.name}] وقناة التواصل الخاصة به بنجاح!`);
    setShowCreateTeam(false);
    setNewTeamName("");
    setNewTeamDesc("");
    setTempMembers([]);
    loadChatData();
  };

  const active = getActiveThread();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)] px-4">
      {/* Side list of conversations / teams */}
      <div className="bg-card border border-brand-dark/5 rounded-3xl p-4 flex flex-col space-y-4 h-full">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-sm text-brand-dark flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-primary" />
            غرف الشات وفرق العمل
          </h2>
          <button
            onClick={() => setShowCreateTeam(!showCreateTeam)}
            className="text-[10px] bg-brand-primary text-brand-bg px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition hover:opacity-90"
          >
            <Plus className="w-3 h-3" />
            فريق جديد
          </button>
        </div>

        {/* Quick Ask AI button */}
        <button
          onClick={() => {
            // Find or create AI Chat Thread
            const aiThread = threads.find((t) => t.id === "thread-ai-cmd");
            if (aiThread) {
              setActiveThreadId("thread-ai-cmd");
            } else {
              const newAiThread: ChatThread = {
                id: "thread-ai-cmd",
                title: "مستشار المتجر الذكي (Ask AI) 🤖",
                type: "support",
                sellerId,
                participants: [sellerId, "ai_assistant"],
                messages: [
                  {
                    id: "m-ai-init",
                    senderId: "ai_assistant",
                    senderName: "مستشار المتجر الذكي (AI)",
                    senderRole: "super_admin",
                    message:
                      "مرحباً بك في مركز الأوامر الذكي! اكتب أي أمر تود تنفيذه مثل:\n• استيراد المنتجات\n• تحسين الصور جماعياً\n• تفعيل الخصومات والتسعير\n• تحليل مبيعات المتجر",
                    timestamp: new Date().toISOString(),
                  },
                ],
                lastMessageAt: new Date().toISOString(),
              };
              const current = MultiVendorStorage.getChatThreads();
              MultiVendorStorage.saveChatThreads([...current, newAiThread]);
              loadChatData();
              setActiveThreadId("thread-ai-cmd");
            }
          }}
          className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-brand-primary/10 to-brand-accent/5 hover:from-brand-primary/15 hover:to-brand-accent/10 border border-brand-primary/20 rounded-2xl text-xs font-bold text-brand-primary transition"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            مركز الأوامر الذكي Ask AI
          </span>
          <Bot className="w-4 h-4" />
        </button>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveThreadId(t.id)}
              className={`w-full text-right p-3 rounded-2xl border transition flex flex-col space-y-1 ${
                activeThreadId === t.id
                  ? "bg-brand-dark text-brand-bg border-brand-dark"
                  : "bg-brand-bg border-brand-dark/5 hover:bg-secondary/45"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs truncate max-w-[150px]">{t.title}</span>
                <span className="text-[9px] opacity-70">
                  {t.type === "team_channel" ? "قناة عمل فريق" : "محادثة عميل"}
                </span>
              </div>
              {t.messages.length > 0 && (
                <p className="text-[10px] opacity-80 truncate">
                  {t.messages[t.messages.length - 1].message}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Conversation area */}
      <div className="md:col-span-2 flex flex-col bg-card border border-brand-dark/5 rounded-3xl p-4 h-full relative">
        {active ? (
          <>
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-brand-dark/5 pb-3 mb-3">
              <div>
                <h3 className="font-bold text-sm text-brand-dark">{active.title}</h3>
                <span className="text-[10px] text-muted-foreground">
                  نوع المحادثة:{" "}
                  {active.type === "team_channel"
                    ? "تواصل داخلي للفريق"
                    : "تواصل مباشر وآمن مع العميل"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground font-bold">
                  متصل الآن بالمتجر
                </span>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
              {active.messages.map((m) => {
                const isMe = m.senderId === (isSuperAdmin ? "super_admin" : sellerId);
                const isSystem = m.senderId === "system";
                const isAI = m.senderId === "ai_assistant";

                if (isSystem) {
                  return (
                    <div key={m.id} className="flex justify-center my-2">
                      <span className="bg-secondary/70 text-brand-dark text-[10px] px-3 py-1.5 rounded-xl font-semibold border border-brand-dark/5">
                        {m.message}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 text-xs space-y-1 relative shadow-sm ${
                        isMe
                          ? "bg-brand-primary text-brand-bg rounded-br-none"
                          : isAI
                            ? "bg-brand-accent/10 border border-brand-accent/20 text-brand-dark rounded-bl-none"
                            : "bg-brand-bg border border-brand-dark/5 text-brand-dark rounded-bl-none"
                      }`}
                    >
                      <span className="block text-[9px] font-bold opacity-80">{m.senderName}</span>
                      <p className="whitespace-pre-line leading-relaxed">{m.message}</p>
                      <div className="flex justify-end items-center gap-1 mt-1 opacity-70 text-[8px]">
                        <span>
                          {new Date(m.timestamp).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-brand-accent/10 border border-brand-accent/20 text-brand-dark rounded-2xl rounded-bl-none p-3 max-w-[70%] text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-accent" />
                    <span>الذكاء الاصطناعي يقوم بتحليل وتجهيز الإجراء المناسب...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Warning and confirmations */}
            {pendingAction && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-pulse">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold block">طلب تأكيد إجراء أمان حساس:</span>
                    <span>{pendingAction.description}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleConfirmAction}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl transition"
                  >
                    تأكيد وتنفيذ
                  </button>
                  <button
                    onClick={() => setPendingAction(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-3 py-1.5 rounded-xl transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.info("إرفاق ملفات أو تصاميم الأثاث كصور متاح في باقات التجار النشطة.");
                }}
                className="w-10 h-10 rounded-xl bg-brand-bg border border-brand-dark/10 grid place-items-center text-muted-foreground hover:bg-secondary/40 transition shrink-0"
              >
                <Image className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="اكتب رسالتك أو أمر الذكاء الاصطناعي هنا..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-brand-primary text-brand-bg grid place-items-center hover:opacity-90 transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-center py-20">
            <div className="space-y-3">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto opacity-40 animate-bounce" />
              <p className="text-xs text-muted-foreground">
                اختر محادثة أو فريق من القائمة للبدء في التواصل الفوري
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Team Overlay Dialog */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 grid place-items-center px-4">
          <div className="bg-card border border-brand-dark/10 rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-brand-dark/5 pb-2">
              <h3 className="font-bold text-sm text-brand-dark flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-primary" />
                تكوين فريق عمل جديد داخل المتجر
              </h3>
              <button
                onClick={() => setShowCreateTeam(false)}
                className="text-xs font-bold text-muted-foreground hover:text-brand-dark"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-dark block">اسم الفريق</label>
                <input
                  type="text"
                  placeholder="مثال: فريق الجودة ومتابعة التركيب"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-dark block">
                  وصف الفريق ومسؤولياته
                </label>
                <textarea
                  placeholder="اكتب هنا مهام الفريق للرجوع إليها..."
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none h-16"
                />
              </div>

              <div className="bg-brand-bg p-3 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-brand-dark block">أعضاء الفريق</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اسم الموظف"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="flex-1 text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="الدور (مثال: نجار)"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="flex-1 text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTempMember}
                    className="bg-brand-dark text-brand-bg text-xs font-bold px-3 py-1.5 rounded-xl"
                  >
                    أضف
                  </button>
                </div>

                {tempMembers.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-brand-dark/5">
                    {tempMembers.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-[10px] bg-card px-2.5 py-1.5 rounded-lg border"
                      >
                        <span>
                          {m.name} — <span className="text-brand-primary">{m.role}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setTempMembers(tempMembers.filter((item) => item.id !== m.id))
                          }
                          className="text-destructive font-bold"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-brand-primary text-brand-bg text-xs font-bold py-3 rounded-xl hover:opacity-90 transition"
              >
                تأكيد وإنشاء الفريق والدردشة
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
