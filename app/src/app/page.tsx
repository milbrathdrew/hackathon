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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatLoading]);

  const analyze = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    setError(null);
    setSummary(null);
    setMessages([]);
    setLoading(true);
    setFileName(file.name);

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
  }, []);

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
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I couldn't answer that right now. Please try again.",
          },
        ]);
      } finally {
        setChatLoading(false);
        inputRef.current?.focus();
      }
    },
    [summary, chatLoading]
  );

  const reset = () => {
    setSummary(null);
    setFileName(null);
    setError(null);
    setMessages([]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Header ── */}
      <header
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 1.5rem",
          height: "56px",
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
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
            <span
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--accent)",
                letterSpacing: "-0.02em",
              }}
            >
              Policy Explainer
            </span>
            <span
              style={{
                fontSize: "0.775rem",
                color: "var(--text-muted)",
                borderLeft: "1px solid var(--border)",
                paddingLeft: "0.75rem",
              }}
            >
              Insurance in plain English
            </span>
          </div>
          {summary && (
            <button
              onClick={reset}
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem 0",
              }}
            >
              ← Analyze another policy
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
            minHeight: "calc(100vh - 56px)",
            padding: "8vh 1.5rem 4rem",
          }}
        >
          <div style={{ width: "100%", maxWidth: "440px" }}>
            <div style={{ marginBottom: "2rem" }}>
              <h1
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "clamp(1.9rem, 5vw, 2.6rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.035em",
                  color: "var(--text)",
                  lineHeight: 1.08,
                  margin: 0,
                }}
              >
                Understand your<br />policy in minutes.
              </h1>
              <p
                style={{
                  color: "var(--text-muted)",
                  marginTop: "0.875rem",
                  fontSize: "0.925rem",
                  lineHeight: 1.6,
                  maxWidth: "360px",
                }}
              >
                Drop your insurance PDF. We'll break it into plain English —
                what's covered, what's not, and how to file a claim. Then ask
                anything.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              style={{
                border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
                background: dragging ? "var(--accent-subtle)" : "var(--surface)",
                borderRadius: "10px",
                padding: "2.25rem 2rem",
                textAlign: "center",
                transition: "border-color 0.12s, background 0.12s",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  margin: "0 auto 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  background: "var(--accent-subtle)",
                  color: "var(--accent)",
                  fontSize: "1.1rem",
                }}
              >
                ↑
              </div>
              <p
                style={{
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  color: "var(--text)",
                  margin: "0 0 0.3rem",
                }}
              >
                Drag your policy PDF here
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  margin: "0 0 1.25rem",
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
                    borderRadius: "7px",
                    padding: "0.475rem 1.1rem",
                    fontSize: "0.825rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background 0.12s",
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
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.825rem",
                  color: "var(--error)",
                }}
              >
                {error}
              </p>
            )}
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
            minHeight: "calc(100vh - 56px)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.65s linear infinite",
                margin: "0 auto 1.125rem",
              }}
            />
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Reading{" "}
              <span style={{ color: "var(--text)", fontWeight: 500 }}>
                {fileName}
              </span>
              …
            </p>
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
            padding: "1.75rem 1.5rem 3rem",
          }}
        >
          {/* Left — Summary */}
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: "0.25rem",
                }}
              >
                Analysis complete
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  letterSpacing: "-0.025em",
                  margin: 0,
                }}
              >
                {fileName}
              </h2>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1px" }}
            >
              {SECTIONS.map(({ key, label }, idx) => (
                <section
                  key={key}
                  className={`animate-fade-up animate-fade-up-delay-${idx + 1}`}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: idx === 0 ? "10px 10px 2px 2px" : idx === 3 ? "2px 2px 10px 10px" : "2px",
                    padding: "1.25rem 1.5rem",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      letterSpacing: "-0.01em",
                      marginBottom: "0.875rem",
                    }}
                  >
                    {label}
                  </h3>
                  <ul
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      margin: 0,
                      padding: 0,
                      listStyle: "none",
                    }}
                  >
                    {(summary[key] ?? []).map((item, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          gap: "0.6rem",
                          fontSize: "0.875rem",
                          lineHeight: 1.55,
                        }}
                      >
                        <span
                          style={{
                            color: "var(--accent)",
                            flexShrink: 0,
                            marginTop: "0.32rem",
                            fontWeight: 500,
                          }}
                        >
                          –
                        </span>
                        <span style={{ color: "var(--text)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          {/* Right — Chat */}
          <div className="chat-panel animate-fade-up">
            {/* Chat header */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--border-subtle)",
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: "var(--text)",
                  margin: "0 0 0.125rem",
                }}
              >
                Ask about your policy
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                I've read the full document and can answer specifics.
              </p>
            </div>

            {/* Messages */}
            <div
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
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginBottom: "0.625rem",
                    }}
                  >
                    Try asking:
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                    }}
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
                          padding: "0.575rem 0.875rem",
                          fontSize: "0.8rem",
                          color: "var(--text)",
                          cursor: "pointer",
                          transition: "border-color 0.12s",
                          lineHeight: 1.4,
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
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "86%",
                      background:
                        msg.role === "user"
                          ? "var(--accent)"
                          : "var(--bg)",
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
                  placeholder="Ask a question about your policy…"
                  disabled={chatLoading}
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
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--accent)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border)")
                  }
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
                    cursor:
                      input.trim() && !chatLoading ? "pointer" : "not-allowed",
                    opacity: input.trim() && !chatLoading ? 1 : 0.45,
                    transition: "opacity 0.12s",
                    flexShrink: 0,
                  }}
                >
                  Ask
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
