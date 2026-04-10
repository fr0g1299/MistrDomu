import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
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
  Sparkles,
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
    text: "Ahoj, jsem AI asistent pro tento návod. Zeptej se mě na jakoukoliv otázku ohledně nějakého kroku nebo nástroje.",
  },
];

const TYPEWRITER_INTERVAL_MS = 25;
const TYPEWRITER_CHUNK_SIZE = 2;
const FREE_USER_MESSAGES_LIMIT = 2;
const getPendingMessageStorageKey = (manualId: number) =>
  `guide-ai-pending-message-${manualId}`;

{
  /* TODO: Clean this file up into compoents */
}
export function AiAssistantCard({ manualId }: { manualId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAwaitingReply, setIsAwaitingReply] = useState(false);
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const nextMessageIdRef = useRef(2);
  const replyTimeoutRef = useRef<number | null>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingMessageStorageKey = getPendingMessageStorageKey(manualId);

  const persistPendingMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;

      try {
        window.sessionStorage.setItem(pendingMessageStorageKey, message);
      } catch (err) {
        console.error("Failed to persist pending message", err);
      }
    },
    [pendingMessageStorageKey],
  );

  const restorePendingMessage = useCallback(() => {
    try {
      const pendingMessage = window.sessionStorage.getItem(
        pendingMessageStorageKey,
      );

      if (!pendingMessage) return;

      setInputValue((currentValue) =>
        currentValue.trim().length > 0 ? currentValue : pendingMessage,
      );
      window.sessionStorage.removeItem(pendingMessageStorageKey);
    } catch (err) {
      console.error("Failed to restore pending message", err);
    }
  }, [pendingMessageStorageKey]);

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
            Accept: "application/json",
          },
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
            Accept: "application/json",
          },
        });
        if (response.ok && !isCancelled) {
          const data = await response.json();
          setHasPaid(data.hasPaid);

          if (data.hasPaid) {
            setRequiresPayment(false);
            restorePendingMessage();
          }
        }
      } catch (err) {
        console.error("Failed to load payment status", err);
      }
    };

    fetchHistory();
    checkPayment();
    return () => {
      isCancelled = true;
    };
  }, [manualId, restorePendingMessage]);

  // Handle payment success redirect from Stripe checkout
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("payment") === "success") {
      // Re-check payment status after returning from Stripe
      (async () => {
        try {
          const response = await fetch(`/api/payment/check/${manualId}`, {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            setHasPaid(data.hasPaid);
            setRequiresPayment(false);

            if (data.hasPaid) {
              restorePendingMessage();
            }

            // Clean up query param from URL
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          }
        } catch (err) {
          console.error("Failed to verify payment after checkout", err);
        }
      })();
    }
  }, [manualId, restorePendingMessage]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;

    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }, [messages, isSending]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const userMessagesCount = messages.filter(
    (message) => message.role === "user",
  ).length;
  const hasReachedFreeMessageLimit =
    userMessagesCount >= FREE_USER_MESSAGES_LIMIT;

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
    if (!trimmedMessage || isSending) return;

    if (!hasPaid && hasReachedFreeMessageLimit) {
      setRequiresPayment(true);
      setPaymentError(null);
      persistPendingMessage(trimmedMessage);
      return;
    }

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
            Accept: "application/json",
          },
          body: JSON.stringify({ manualId, message: trimmedMessage }),
        });

        setIsAwaitingReply(false);

        if (response.status === 402) {
          setMessages((prev) =>
            prev.filter((message) => message.id !== userMessage.id),
          );
          setInputValue(trimmedMessage);
          persistPendingMessage(trimmedMessage);
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
        className={`relative gap-3 2xl:p-5 px-3 py-5 transition-all duration-200 ${
          isExpandedModalOpen
            ? "bg-card/95 border-primary/15 fixed left-1/2 top-[50%] z-50 h-[80vh] w-[min(92vw,76rem)] -translate-x-1/2 -translate-y-1/2"
            : "bg-primary/5 border-primary/30 flex-1 min-h-0"
        }`}
      >
        <div>
          <span className="flex items-center gap-2">
            {hasPaid && (
              <Sparkles className="size-5 text-primary/90 ml-2 mr-1 inline" />
            )}
            <h3 className="pr-12 text-base font-bold">
              AI asistent {hasPaid ? " (Bez limitu)" : ""}
            </h3>
          </span>
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
          className={`space-y-3 overflow-y-auto rounded-md solid-scrollbar bg-transparent py-2 px-1 ${
            isExpandedModalOpen
              ? "h-[calc(88vh-13.5rem)]"
              : "h-[calc(75vh-13.5rem)]"
            // TODO: It can be expanding with the code below
            // : "min-h-128 max-h-[calc(75vh-13.5rem)]"
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
                  className={
                    isUser
                      ? "rounded-xl rounded-br-sm border border-primary/50 bg-primary/10 px-3 py-2 text-sm"
                      : "rounded-xl rounded-bl-sm border border-zinc-600 bg-zinc-200/80 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800/90 dark:text-zinc-100"
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
                    <p className="wrap-break-word prose prose-sm dark:prose-invert">
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

        {!requiresPayment && (
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Napište dotaz..."
              className="solid-scrollbar placeholder:text-muted-foreground selection:bg-primary! selection:text-primary-foreground! bg-input/30 border-input min-h-10 w-full rounded-md border px-3 py-2 text-base transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring aria-invalid:border-destructive md:text-sm resize-none"
            />
            <Button
              type="submit"
              size="sm"
              className="h-10 rounded-full"
              disabled={isSending || inputValue.trim().length === 0}
            >
              <SendHorizontal className="size-5" />
            </Button>
          </form>
        )}

        {requiresPayment && (
          <div
            className="flex flex-wrap flex-col items-center justify-center rounded-md border border-primary/35 bg-primary/10 p-3 text-sm"
            aria-live="polite"
          >
            <p className="font-semibold text-primary-900 dark:text-primary-100">
              Chcete se ptát dále?
            </p>
            <p className="mt-1 text-zinc-300 font-semibold text-center">
              Vaše dvě zkušební zprávy jsou vyčerpány.
            </p>
            <p className="mt-1 text-muted-foreground text-center">
              Odemkněte si neomezený AI chat pro tento návod a ptejte se na
              cokoliv, co vás při práci napadne!
            </p>
            {paymentError && (
              <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                {paymentError}
              </p>
            )}
            <Button
              id="btn-pay-for-manual"
              type="button"
              className="mt-3 mx-auto"
              disabled={isCheckingOut}
              onClick={async () => {
                setIsCheckingOut(true);
                setPaymentError(null);
                try {
                  const res = await fetch("/api/payment/checkout", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ manualId }),
                  });
                  if (!res.ok) {
                    const responseText = (await res.text()).trim();
                    setPaymentError(
                      responseText ||
                        "Platbu se nepodařilo spustit. Zkontrolujte Stripe konfiguraci.",
                    );
                    return;
                  }

                  const data = await res.json();
                  if (data.alreadyPaid) {
                    setHasPaid(true);
                    setRequiresPayment(false);
                    setPaymentError(null);
                    restorePendingMessage();
                  } else if (data.url) {
                    persistPendingMessage(inputValue);
                    window.location.href = data.url;
                  } else {
                    setPaymentError(
                      "Stripe nevrátil checkout adresu. Zkuste to prosím znovu.",
                    );
                  }
                } catch (error) {
                  setPaymentError(
                    error instanceof Error
                      ? error.message
                      : "Platbu se nepodařilo spustit.",
                  );
                } finally {
                  setIsCheckingOut(false);
                }
              }}
            >
              {isCheckingOut ? "Přesměrování..." : "Odemknout neomezený chat"}
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
