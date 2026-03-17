"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Summary = {
  covered: string[];
  excluded: string[];
  limits: string[];
  claims: string[];
  context: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SECTIONS = [
  { key: "covered" as const, label: "What's Covered" },
  { key: "excluded" as const, label: "What's Excluded" },
  { key: "limits" as const, label: "Limits & Deductibles" },
  { key: "claims" as const, label: "How to File a Claim" },
];

const SUGGESTED = [
  "Does this cover pre-existing conditions?",
  "What's my out-of-pocket maximum?",
  "How long do I have to file a claim?",
  "Is emergency care covered abroad?",
];

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [trivia, setTrivia] = useState<{ question: string; answer: string } | null>(null);
  const [triviaRevealed, setTriviaRevealed] = useState(false);
  const [eli5, setEli5] = useState<string[] | null>(null);
  const [eli5Loading, setEli5Loading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatLoading]);

  const fetchTrivia = useCallback(async () => {
    try {
      const res = await fetch(
        "https://opentdb.com/api.php?amount=1&category=11&type=multiple"
      );
      const data = await res.json();
      const item = data.results?.[0];
      if (!item) return;
      const decode = (str: string) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = str;
        return txt.value;
      };
      setTrivia({ question: decode(item.question), answer: decode(item.correct_answer) });
      setTriviaRevealed(false);
    } catch {
      // Silently skip — trivia is non-essential
    }
  }, []);

  const analyze = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      setError(null);
      setSummary(null);
      setMessages([]);
      setTrivia(null);
      setTriviaRevealed(false);
      setLoading(true);
      setFileName(file.name);
      fetchTrivia();

      const form = new FormData();
      form.append("file", file);

      try {
        const res = await fetch("/api/analyze", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Analysis failed");
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [fetchTrivia]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) analyze(file);
    },
    [analyze]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) analyze(file);
    },
    [analyze]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !summary?.context || chatLoading) return;
      const trimmed = text.trim();
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      setChatLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed, context: summary.context }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I couldn't answer that right now. Please try again." },
        ]);
      } finally {
        setChatLoading(false);
        inputRef.current?.focus();
      }
    },
    [summary, chatLoading]
  );

  const explainLikeFive = useCallback(async () => {
    if (!summary?.context || eli5Loading) return;
    setEli5(null);
    setEli5Loading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question:
            "Explain this insurance policy like I'm five years old. Be genuinely simple and a little funny — imagine explaining it to a kid who has no idea what insurance is. No emojis. No jargon. Short sentences only. Return exactly 5 bullet points, one per line, starting each line with a dash. Cover: what this policy is for, what it protects, one big thing it won't cover, what happens if something goes wrong, and one surprising or weird thing about it.",
          context: summary.context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const bullets = (data.answer as string)
        .split("\n")
        .map((l: string) => l.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);
      setEli5(bullets);
    } catch {
      setEli5(["Couldn't simplify this one. Try asking in the chat below."]);
    } finally {
      setEli5Loading(false);
    }
  }, [summary, eli5Loading]);

  const reset = () => {
    setSummary(null);
    setFileName(null);
    setError(null);
    setMessages([]);
    setEli5(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Header — green authority bar ── */}
      <header
        style={{
          background: "var(--accent)",
          padding: "0 1.5rem",
          height: "52px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "var(--text-on-accent)",
              letterSpacing: "-0.03em",
            }}
          >
            Legible
          </span>
          {summary && (
            <button
              onClick={reset}
              style={{
                fontSize: "0.8rem",
                color: "var(--text-on-accent)",
                opacity: 0.8,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem 0",
                fontFamily: "inherit",
              }}
            >
              ← New policy
            </button>
          )}
        </div>
      </header>

      {/* ── Upload ── */}
      {!summary && !loading && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            minHeight: "calc(100vh - 52px)",
            padding: "10vh 1.5rem 4rem",
          }}
        >
          <div style={{ width: "100%", maxWidth: "460px" }}>

            {/* Large editorial heading */}
            <h1
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "clamp(2.8rem, 7vw, 4.2rem)",
                fontWeight: 600,
                letterSpacing: "-0.045em",
                color: "var(--text)",
                lineHeight: 1.0,
                margin: "0 0 1.25rem",
              }}
            >
              Your policy,<br />finally legible.
            </h1>

            {/* Accent rule — the brand mark */}
            <div
              style={{
                width: "36px",
                height: "2px",
                background: "var(--accent)",
                marginBottom: "1.25rem",
              }}
            />

            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                lineHeight: 1.65,
                margin: "0 0 2.25rem",
                maxWidth: "340px",
              }}
            >
              Drop any insurance PDF — health, auto, home, renters. We&apos;ll
              break it into plain English: what&apos;s covered, what&apos;s not,
              and how to file a claim.
            </p>

            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              style={{
                border: `1px solid ${dragging ? "var(--accent)" : "var(--border)"}`,
                background: dragging ? "var(--accent-subtle)" : "var(--surface)",
                borderRadius: "8px",
                padding: "2.25rem 2rem",
                textAlign: "center",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  margin: "0 auto 1.125rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="26"
                  height="30"
                  viewBox="0 0 26 30"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="0.75"
                    y="0.75"
                    width="24.5"
                    height="28.5"
                    rx="2.5"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    fill="var(--accent-subtle)"
                  />
                  <path
                    d="M6 10h14M6 14.5h14M6 19h9"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p
                style={{
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  color: "var(--text)",
                  margin: "0 0 0.25rem",
                }}
              >
                Drag your policy PDF here
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  margin: "0 0 1.375rem",
                }}
              >
                or click to browse
              </p>
              <label>
                <span
                  style={{
                    display: "inline-block",
                    background: "var(--accent)",
                    color: "var(--text-on-accent)",
                    borderRadius: "6px",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.825rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background 0.12s",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseOver={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "var(--accent-hover)")
                  }
                  onMouseOut={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "var(--accent)")
                  }
                >
                  Choose file
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={onFileChange}
                />
              </label>
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.825rem",
                  color: "var(--error)",
                }}
              >
                {error}
              </p>
            )}

            {/* Technical approach */}
            <div style={{ marginTop: "2rem" }}>
              <button
                onClick={() => setTechOpen((o) => !o)}
                aria-expanded={techOpen}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "0.775rem",
                  color: "var(--text-muted)",
                  fontFamily: "inherit",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transition: "transform 0.15s",
                    transform: techOpen ? "rotate(90deg)" : "rotate(0deg)",
                    fontSize: "0.6rem",
                  }}
                >
                  ▶
                </span>
                How it works technically
              </button>

              {techOpen && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1.25rem 1.5rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                    {[
                      {
                        heading: "PDF → Claude directly",
                        body: "The PDF is base64-encoded and passed to Claude as a native document block — no parsing library needed. The model reads structure, tables, and legal language natively.",
                      },
                      {
                        heading: "One-shot structured extraction",
                        body: "A single API call to Claude Opus extracts five fields: what's covered, exclusions, limits, claims steps, and a 600–900 word prose summary. The response is parsed as strict JSON.",
                      },
                      {
                        heading: "Context-grounded Q&A",
                        body: "The prose summary becomes the system prompt for every chat turn. No vector store, no embeddings — the full policy context is injected directly, keeping latency low and answers accurate.",
                      },
                      {
                        heading: "Stateless by design",
                        body: "No database. No auth. All state lives in React for the session. Each chat message is an independent API call; conversation history is rendered locally only.",
                      },
                    ].map(({ heading, body }) => (
                      <div key={heading}>
                        <p
                          style={{
                            fontFamily: "var(--font-fraunces)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--text)",
                            margin: "0 0 0.2rem",
                            letterSpacing: "-0.015em",
                          }}
                        >
                          {heading}
                        </p>
                        <p
                          style={{
                            fontSize: "0.775rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.6,
                            margin: 0,
                          }}
                        >
                          {body}
                        </p>
                      </div>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 52px)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "1.5px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.65s linear infinite",
                margin: "0 auto 1.25rem",
              }}
            />
            <p
              style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}
            >
              Reading{" "}
              <span style={{ color: "var(--text)", fontWeight: 500 }}>
                {fileName}
              </span>
              …
            </p>

            {trivia && (
              <div
                style={{
                  marginTop: "2.25rem",
                  maxWidth: "320px",
                  textAlign: "left",
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "1.125rem 1.25rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.675rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Movie trivia while you wait
                </p>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text)",
                    lineHeight: 1.55,
                    marginBottom: "0.75rem",
                  }}
                >
                  {trivia.question}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {triviaRevealed ? (
                    <p
                      style={{
                        fontSize: "0.825rem",
                        color: "var(--accent)",
                        fontWeight: 500,
                        margin: 0,
                      }}
                    >
                      {trivia.answer}
                    </p>
                  ) : (
                    <button
                      onClick={() => setTriviaRevealed(true)}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: "5px",
                        padding: "0.3rem 0.7rem",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Reveal answer
                    </button>
                  )}
                  {triviaRevealed && (
                    <button
                      onClick={fetchTrivia}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: "5px",
                        padding: "0.3rem 0.7rem",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {summary && (
        <div
          className="results-grid"
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "2rem 1.5rem 4rem",
          }}
        >
          {/* Left — Summary */}
          <div>
            {/* File header */}
            <div
              style={{
                marginBottom: "1.75rem",
                paddingBottom: "1.5rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
                  marginBottom: "0.3rem",
                }}
              >
                Analysis complete
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  letterSpacing: "-0.025em",
                  margin: 0,
                }}
              >
                {fileName}
              </h2>
            </div>

            {/* ELI5 — text link, not a button card */}
            {!eli5 && !eli5Loading && (
              <button
                onClick={explainLikeFive}
                style={{
                  marginBottom: "1.5rem",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.825rem",
                  color: "var(--accent)",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                Explain like I&apos;m five →
              </button>
            )}

            {eli5Loading && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "1.5rem",
                }}
              >
                Simplifying…
              </p>
            )}

            {/* ELI5 result — left-border annotation block */}
            {eli5 && (
              <div
                className="animate-fade-up"
                style={{
                  marginBottom: "1.75rem",
                  paddingLeft: "1rem",
                  borderLeft: "2px solid var(--accent)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "0.75rem",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontSize: "0.825rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      letterSpacing: "-0.015em",
                      margin: 0,
                    }}
                  >
                    In plain English
                  </p>
                  <button
                    onClick={() => setEli5(null)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    Dismiss
                  </button>
                </div>
                <ul
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.45rem",
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                  }}
                >
                  {eli5.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        gap: "0.65rem",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--accent)",
                          flexShrink: 0,
                          marginTop: "0.3rem",
                          fontWeight: 500,
                          fontSize: "0.8rem",
                        }}
                      >
                        –
                      </span>
                      <span style={{ color: "var(--text)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Numbered sections — ruled document layout */}
            <div style={{ borderTop: "1px solid var(--border)" }}>
              {SECTIONS.map(({ key, label }, idx) => {
                const isOpen = !!openSections[key];
                const num = String(idx + 1).padStart(2, "0");
                return (
                  <section
                    key={key}
                    className={`animate-fade-up animate-fade-up-delay-${idx + 1}`}
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <button
                      onClick={() =>
                        setOpenSections((prev) => ({ ...prev, [key]: !isOpen }))
                      }
                      aria-expanded={isOpen}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        background: "none",
                        border: "none",
                        padding: "1.125rem 0",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 500,
                          color: "var(--text-muted)",
                          letterSpacing: "0.04em",
                          flexShrink: 0,
                          minWidth: "1.5rem",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {num}
                      </span>
                      <h3
                        style={{
                          fontFamily: "var(--font-fraunces)",
                          fontSize: "0.925rem",
                          fontWeight: 600,
                          color: "var(--text)",
                          letterSpacing: "-0.015em",
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        {label}
                      </h3>
                      <span
                        style={{
                          fontSize: "0.6rem",
                          color: "var(--text-muted)",
                          display: "inline-block",
                          transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                          flexShrink: 0,
                        }}
                      >
                        ▶
                      </span>
                    </button>

                    {isOpen && (
                      <ul
                        className="animate-fade-up"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          margin: "0 0 1.25rem 2.5rem",
                          padding: 0,
                          listStyle: "none",
                        }}
                      >
                        {(summary[key] ?? []).map((item, i) => (
                          <li
                            key={i}
                            style={{
                              display: "flex",
                              gap: "0.65rem",
                              fontSize: "0.875rem",
                              lineHeight: 1.6,
                            }}
                          >
                            <span
                              style={{
                                color: "var(--accent)",
                                flexShrink: 0,
                                marginTop: "0.3rem",
                                fontWeight: 500,
                                fontSize: "0.8rem",
                              }}
                            >
                              –
                            </span>
                            <span style={{ color: "var(--text)" }}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          </div>

          {/* Right — Chat */}
          <div className="chat-panel animate-fade-up">
            <div
              style={{
                padding: "1rem 1.25rem 0.875rem",
                borderBottom: "1px solid var(--border-subtle)",
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  letterSpacing: "-0.015em",
                  color: "var(--text)",
                  margin: "0 0 0.2rem",
                }}
              >
                Ask about your policy
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                I&apos;ve read the full document.
              </p>
            </div>

            {/* Messages */}
            <div
              aria-live="polite"
              aria-label="Conversation"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {messages.length === 0 && (
                <div>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 500,
                      color: "var(--text-muted)",
                      marginBottom: "0.625rem",
                    }}
                  >
                    Try asking
                  </p>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
                  >
                    {SUGGESTED.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        style={{
                          textAlign: "left",
                          background: "var(--bg)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "7px",
                          padding: "0.55rem 0.875rem",
                          fontSize: "0.8rem",
                          color: "var(--text)",
                          cursor: "pointer",
                          transition: "border-color 0.12s",
                          lineHeight: 1.45,
                          fontFamily: "inherit",
                        }}
                        onMouseOver={(e) =>
                          ((e.currentTarget as HTMLElement).style.borderColor =
                            "var(--accent)")
                        }
                        onMouseOut={(e) =>
                          ((e.currentTarget as HTMLElement).style.borderColor =
                            "var(--border-subtle)")
                        }
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "88%",
                      background:
                        msg.role === "user" ? "var(--accent)" : "var(--bg)",
                      color:
                        msg.role === "user"
                          ? "var(--text-on-accent)"
                          : "var(--text)",
                      border:
                        msg.role === "assistant"
                          ? "1px solid var(--border-subtle)"
                          : "none",
                      borderRadius:
                        msg.role === "user"
                          ? "12px 12px 3px 12px"
                          : "12px 12px 12px 3px",
                      padding: "0.6rem 0.875rem",
                      fontSize: "0.85rem",
                      lineHeight: 1.55,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "12px 12px 12px 3px",
                      padding: "0.7rem 0.875rem",
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: "var(--text-muted)",
                          display: "block",
                          animation: `dot-pulse 1.1s ease-in-out ${i * 0.18}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "0.875rem 1.25rem",
                borderTop: "1px solid var(--border-subtle)",
                flexShrink: 0,
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                style={{ display: "flex", gap: "0.5rem" }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your policy…"
                  disabled={chatLoading}
                  className="chat-input"
                  aria-label="Your question"
                  style={{
                    flex: 1,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "7px",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.825rem",
                    color: "var(--text)",
                    outline: "none",
                    transition: "border-color 0.12s",
                    minWidth: 0,
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || chatLoading}
                  style={{
                    background: "var(--accent)",
                    color: "var(--text-on-accent)",
                    border: "none",
                    borderRadius: "7px",
                    padding: "0.5rem 0.875rem",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    cursor: input.trim() && !chatLoading ? "pointer" : "not-allowed",
                    opacity: input.trim() && !chatLoading ? 1 : 0.45,
                    transition: "opacity 0.12s",
                    flexShrink: 0,
                    fontFamily: "inherit",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
