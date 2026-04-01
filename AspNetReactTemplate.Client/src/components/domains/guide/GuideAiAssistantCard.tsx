import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bot,
  SendHorizontal,
  User2,
  ArrowUp,
  Minimize,
  Maximize,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    text: "Ahoj, jsem AI asistent pro tento návod. Zeptej se mě na jakoukoliv otázku ohledně tohoto krok nebo nástroje.",
  },
];



const TYPEWRITER_INTERVAL_MS = 18;
const TYPEWRITER_CHUNK_SIZE = 2;
const FREE_USER_MESSAGES_LIMIT = 2;

{
  /* TODO: Clean this file up into compoents */
}
export function GuideAiAssistantCard({ manualId }: { manualId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAwaitingReply, setIsAwaitingReply] = useState(false);
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  const nextMessageIdRef = useRef(2);
  const replyTimeoutRef = useRef<number | null>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeInput = () => {
    if (!inputRef.current) return;

    const textarea = inputRef.current;
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 20;
    const maxHeight = lineHeight * 8;

    textarea.style.height = "auto";

    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current !== null) {
        window.clearTimeout(replyTimeoutRef.current);
      }

      if (typingIntervalRef.current !== null) {
        window.clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!manualId) return;

    let isCancelled = false;
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/AiChat/${manualId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });

        if (response.ok && !isCancelled) {
          const history = await response.json();
          if (history && history.length > 0) {
            setMessages(history);
            const maxId = Math.max(...history.map((m: any) => m.id));
            if (maxId > 0) {
              nextMessageIdRef.current = maxId + 1;
            }
          }
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };

    const checkPayment = async () => {
      try {
        const response = await fetch(`/api/payment/check/${manualId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });
        if (response.ok && !isCancelled) {
          const data = await response.json();
          setHasPaid(data.hasPaid);
        }
      } catch (err) {
        console.error("Failed to load payment status", err);
      }
    };

    fetchHistory();
    checkPayment();
    return () => { isCancelled = true; };
  }, [manualId]);

  // Handle payment success redirect from Stripe checkout
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('payment') === 'success') {
      // Re-check payment status after returning from Stripe
      (async () => {
        try {
          const response = await fetch(`/api/payment/check/${manualId}`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Accept": "application/json"
            }
          });
          if (response.ok) {
            const data = await response.json();
            setHasPaid(data.hasPaid);
            setRequiresPayment(false);
            // Clean up query param from URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err) {
          console.error("Failed to verify payment after checkout", err);
        }
      })();
    }
  }, [manualId]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;

    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }, [messages, isSending]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const userMessagesCount = messages.filter(
    (message) => message.role === "user",
  ).length;
  const hasReachedMessageLimit = !hasPaid && userMessagesCount >= FREE_USER_MESSAGES_LIMIT;

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 120);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    resizeInput();
  }, [inputValue]);

  useEffect(() => {
    if (!isExpandedModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpandedModalOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpandedModalOpen]);

  const handleInputKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isSending || hasReachedMessageLimit) return;

    const userMessage: ChatMessage = {
      id: nextMessageIdRef.current,
      role: "user",
      text: trimmedMessage,
    };
    nextMessageIdRef.current += 1;

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);
    setIsAwaitingReply(true);

    const fetchAiReply = async () => {
      try {
        const response = await fetch("/api/AiChat", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ manualId, message: trimmedMessage }),
        });

        setIsAwaitingReply(false);

        if (response.status === 402) {
          setIsSending(false);
          setRequiresPayment(true);
          return;
        }

        if (!response.ok) {
          const serverMessage = (await response.text()).trim();
          throw new Error(serverMessage || "Failed to get AI response");
        }

        const data = await response.json();
        const assistantReply = data.reply;
        
        const assistantMessageId = nextMessageIdRef.current;
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          text: "",
        };
        nextMessageIdRef.current += 1;

        setMessages((prev) => [...prev, assistantMessage]);

        let visibleLength = 0;

        if (typingIntervalRef.current !== null) {
          window.clearInterval(typingIntervalRef.current);
        }

        typingIntervalRef.current = window.setInterval(() => {
          visibleLength = Math.min(
            visibleLength + TYPEWRITER_CHUNK_SIZE,
            assistantReply.length,
          );

          const nextText = assistantReply.slice(0, visibleLength);

          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? { ...message, text: nextText }
                : message,
            ),
          );

          if (visibleLength >= assistantReply.length) {
            if (typingIntervalRef.current !== null) {
              window.clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
            }

            setIsSending(false);
          }
        }, TYPEWRITER_INTERVAL_MS);
      } catch (err) {
        setIsAwaitingReply(false);
        setIsSending(false);

        const errorText =
          err instanceof Error && err.message
            ? err.message
            : "Omlouvám se, došlo k chybě při komunikaci se serverem.";

        const userFacingError = errorText.includes("API key is not configured")
          ? "AI není nakonfigurovaná: chybí Gemini API klíč na backendu."
          : errorText;
        
        const errorMessageId = nextMessageIdRef.current;
        const errorMessage: ChatMessage = {
          id: errorMessageId,
          role: "assistant",
          text: userFacingError,
        };
        nextMessageIdRef.current += 1;
        setMessages((prev) => [...prev, errorMessage]);
      }
    };
    
    fetchAiReply();
  };

  return (
    <>
      {isExpandedModalOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
          onClick={() => setIsExpandedModalOpen(false)}
          aria-hidden="true"
        />
      )}

      <Card
        className={`relative gap-3 p-5 transition-all duration-200 ${
          isExpandedModalOpen
            ? "bg-card/95 border-primary/15 fixed left-1/2 top-[53%] z-50 h-[85vh] w-[min(92vw,76rem)] -translate-x-1/2 -translate-y-1/2"
            : "bg-primary/5 border-primary/30 flex-1 min-h-0"
        }`}
      >
        <div>
          <h3 className="pr-12 text-base font-bold">AI asistent</h3>
          <p className="text-sm text-zinc-700 dark:text-zinc-400">
            Napište dotaz k postupu manuálu.
          </p>

          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={
              isExpandedModalOpen
                ? "Zmenšit chat"
                : "Otevřít chat ve větším okně"
            }
            className="absolute right-4 top-4 h-8 w-8 rounded-full"
            onClick={() => setIsExpandedModalOpen((prev) => !prev)}
          >
            {isExpandedModalOpen ? (
              <Minimize className="size-4" />
            ) : (
              <Maximize className="size-4" />
            )}
          </Button>
        </div>

        <div
          ref={messagesContainerRef}
          className={`space-y-3 overflow-y-auto rounded-md hide-scrollbar bg-transparent p-2 ${
            isExpandedModalOpen ? "h-[calc(88vh-13.5rem)]" : "h-128"
          }`}
          aria-live="polite"
        >
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={isUser ? "ml-8 flex justify-end" : "mr-8 flex"}
              >
                <div
                  // TODO: Make better background color for user
                  className={
                    isUser
                      ? "rounded-xl rounded-br-sm bg-primary/90 px-3 py-2 text-sm text-primary-foreground"
                      : "rounded-xl rounded-bl-sm bg-zinc-200/80 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800/90 dark:text-zinc-100"
                  }
                >
                  <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold opacity-80">
                    {isUser ? (
                      <>
                        <User2 className="size-3" />
                        Vy
                      </>
                    ) : (
                      <>
                        <Bot className="size-3" />
                        AI
                      </>
                    )}
                  </p>
                  {isUser ? (
                    <p className="whitespace-pre-wrap wrap-break-word selection:text-primary-50! selection:bg-primary-700!">
                      {message.text}
                    </p>
                  ) : (
                    <div className="wrap-break-word prose prose-sm dark:prose-invert prose-a:hover:text-primary-700">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isAwaitingReply && (
            <div className="mr-8 flex">
              <div className="rounded-xl rounded-bl-sm bg-zinc-200/80 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800/90 dark:text-zinc-100">
                <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold opacity-80">
                  <Bot className="size-3" />
                  AI
                </p>
                <p className="italic opacity-80">Píšu odpověď...</p>
              </div>
            </div>
          )}
        </div>

        {!hasReachedMessageLimit && !requiresPayment && (
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={
                hasReachedMessageLimit
                  ? "Limit zpráv byl dosažen. Pro pokračování aktivujte placený tarif."
                  : "Napište dotaz..."
              }
              disabled={hasReachedMessageLimit}
              className="hide-scrollbar placeholder:text-muted-foreground selection:bg-primary! selection:text-primary-foreground! bg-input/30 border-input min-h-10 w-full rounded-md border px-3 py-2 text-base transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring aria-invalid:border-destructive md:text-sm resize-none"
            />
            <Button
              type="submit"
              size="sm"
              className="h-10 rounded-full"
              disabled={
                isSending ||
                hasReachedMessageLimit ||
                inputValue.trim().length === 0
              }
            >
              <SendHorizontal className="size-5" />
            </Button>
          </form>
        )}

        {(hasReachedMessageLimit || requiresPayment) && (
          <div className="flex flex-wrap flex-col justify-center items-center rounded-md border border-primary/35 bg-primary/10 p-3 text-sm">
            <p className="font-semibold text-primary-900 dark:text-primary-100">
              Dosáhli jste bezplatného limitu 2 zpráv.
            </p>
            <p className="mt-1 text-zinc-700 dark:text-zinc-300">
              Pro další zprávy si prosím odemkněte přístup k tomuto návodu.
            </p>
            <Button
              id="btn-pay-for-manual"
              type="button"
              className="mt-3 mx-auto"
              disabled={isCheckingOut}
              onClick={async () => {
                setIsCheckingOut(true);
                try {
                  const res = await fetch("/api/payment/checkout", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ manualId }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.alreadyPaid) {
                      setRequiresPayment(false);
                    } else if (data.url) {
                      window.location.href = data.url;
                    }
                  }
                } finally {
                  setIsCheckingOut(false);
                }
              }}
            >
              {isCheckingOut ? "Přesměrování..." : "Odemknout přístup"}
            </Button>
          </div>
        )}

        {/* Floating scroll-to-top button */}
        <button
          type="button"
          aria-label="Scroll to top"
          onClick={() => {
            const el = messagesContainerRef.current;
            if (!el) return;
            el.scrollTo({ top: 0, behavior: "smooth" });
            setShowScrollTop(false);
          }}
          className={`animate-bounce pointer-events-auto transition-all duration-200 absolute left-1/2 -translate-x-1/2 top-20 flex h-10 w-10 items-center justify-center rounded-full bg-primary-900 text-primary-50 hover:scale-105 shadow-lg focus:outline-none ${
            showScrollTop
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <ArrowUp className="size-5" />
        </button>
      </Card>
    </>
  );
}
