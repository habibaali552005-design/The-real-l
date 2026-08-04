import { useState, useEffect, useRef, useCallback } from "react";
import { MarketplaceStore, DirectConversation, DirectMessage } from "@/lib/marketplaceStore";
import { MessageSquare, Send, Image, X, User, Store, Paperclip } from "lucide-react";
import { toast } from "sonner";

interface DirectMessagingProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId?: string;
  sellerName?: string;
  productName?: string;
}

export function DirectMessagingModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  productName,
}: DirectMessagingProps) {
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(() => {
    const list = MarketplaceStore.getConversations();
    setConversations(list);

    // If sellerId was passed to auto-open or create conversation
    if (sellerId && sellerName) {
      const convId = MarketplaceStore.createConversation(
        "حبيبة علي",
        sellerId,
        sellerName,
        productName,
      );
      setActiveConvId(convId);
    } else if (list.length > 0 && !activeConvId) {
      setActiveConvId(list[0].id);
    }
  }, [activeConvId, productName, sellerId, sellerName]);

  useEffect(() => {
    if (isOpen) {
      loadConvs();
    }
    const handleUpdate = () => {
      setConversations(MarketplaceStore.getConversations());
      if (activeConvId) {
        setMessages(MarketplaceStore.getMessages(activeConvId));
      }
    };
    window.addEventListener("beitak-messages-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("beitak-messages-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [isOpen, loadConvs, activeConvId]);

  useEffect(() => {
    if (activeConvId) {
      setMessages(MarketplaceStore.getMessages(activeConvId));
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [activeConvId]);

  if (!isOpen) return null;

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || (!newMessageText.trim() && !attachmentUrl)) return;

    MarketplaceStore.sendMessage(activeConvId, {
      senderId: "user-current",
      senderName: "حبيبة علي",
      senderRole: "buyer",
      message: newMessageText.trim(),
      attachmentUrl,
    });

    setNewMessageText("");
    setAttachmentUrl(undefined);

    // Auto simulate seller response if first message
    setTimeout(() => {
      MarketplaceStore.sendMessage(activeConvId, {
        senderId: activeConv?.sellerId || "seller-auto",
        senderName: activeConv?.sellerName || "البائع المعتمد",
        senderRole: "seller",
        message: "شكراً لتواصلك معنا! أهلاً بك في متجرنا وسنسعد بالإجابة على استفسارك بأسرع وقت.",
      });
    }, 1200);
  };

  const handleAttachImage = () => {
    const url = prompt(
      "أدخل رابط صورة المرفق (URL):",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&fit=crop",
    );
    if (url) {
      setAttachmentUrl(url);
      toast.success("تم إرفاق الصورة بنجاح");
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-xs z-50 grid place-items-center p-3 md:p-6">
      <div
        className="bg-card w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl border border-brand-dark/15 flex flex-col md:flex-row overflow-hidden"
        dir="rtl"
      >
        {/* Sidebar: Conversations List */}
        <div className="w-full md:w-80 bg-secondary/30 border-b md:border-b-0 md:border-l border-brand-dark/10 flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-brand-dark/10 bg-brand-dark text-white flex items-center justify-between">
            <h3 className="font-black text-xs md:text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-accent" />
              المحادثات والرسائل Direct
            </h3>
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-full text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-center py-10 text-xs font-bold text-muted-foreground">
                لا توجد محادثات جارية حالياً
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                    conv.id === activeConvId
                      ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                      : "bg-white hover:bg-secondary border-brand-dark/10 text-brand-dark"
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-brand-accent/20 border border-brand-accent/30 grid place-items-center shrink-0">
                    <Store
                      className={`w-5 h-5 ${conv.id === activeConvId ? "text-brand-accent" : "text-brand-primary"}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs truncate">{conv.sellerName}</h4>
                      <span className="text-[10px] opacity-75">{conv.lastMessageAt}</span>
                    </div>
                    {conv.productName && (
                      <p className="text-[10px] opacity-80 truncate font-semibold">
                        منتج: {conv.productName}
                      </p>
                    )}
                    <p className="text-[11px] truncate opacity-90 font-medium">
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Main Window */}
        <div className="flex-1 flex flex-col h-full bg-card min-w-0">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-brand-dark/10 bg-white flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 grid place-items-center text-brand-primary">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-brand-dark">{activeConv.sellerName}</h3>
                    {activeConv.productName && (
                      <span className="text-xs text-brand-primary font-bold block">
                        استفسار عن: {activeConv.productName}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-secondary text-brand-dark transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.map((msg) => {
                  const isMe = msg.senderRole === "buyer";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isMe ? "ms-auto items-end" : "me-auto items-start"}`}
                    >
                      <span className="text-[10px] font-bold text-muted-foreground mb-1 px-1">
                        {msg.senderName} • {msg.createdAt}
                      </span>
                      <div
                        className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-2xs space-y-2 ${
                          isMe
                            ? "bg-brand-primary text-white rounded-tl-none"
                            : "bg-white border border-brand-dark/10 text-brand-dark rounded-tr-none"
                        }`}
                      >
                        <p>{msg.message}</p>
                        {msg.attachmentUrl && (
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl overflow-hidden border border-white/20 mt-2"
                          >
                            <img
                              src={msg.attachmentUrl}
                              alt="Attachment"
                              className="max-h-48 w-full object-cover"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-brand-dark/10 bg-white space-y-2"
              >
                {attachmentUrl && (
                  <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-xl text-xs">
                    <Image className="w-4 h-4 text-brand-primary" />
                    <span className="truncate flex-1 font-bold text-brand-dark">
                      {attachmentUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachmentUrl(undefined)}
                      className="text-rose-600 hover:font-bold"
                    >
                      إزالة
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAttachImage}
                    className="p-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-brand-dark transition cursor-pointer"
                    title="إرفاق صورة"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="اكتب رسالتك للبائع هنا..."
                    className="flex-1 bg-secondary/40 border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs outline-none focus:border-brand-primary font-bold text-brand-dark"
                  />

                  <button
                    type="submit"
                    className="bg-brand-primary text-white font-black px-5 py-2.5 rounded-2xl text-xs hover:bg-brand-dark transition shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    إرسال <Send className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 grid place-items-center p-8 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-xs font-bold text-muted-foreground">
                اختر محادثة من القائمة الجانبية لبدء الشات المباشر
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
