# Policy Explainer — Hackathon Spec

---

## Claude Code Prompt

> Use the following prompt to kick off development with Claude Code:

```
Build a single-page web application called "Policy Explainer" that allows a user to upload an insurance policy PDF and ask questions about it in plain English.

Requirements:

1. PDF Upload
   - Accept a PDF file upload via drag-and-drop or file picker
   - Extract and display a plain-English summary of the policy on upload
   - Show key coverage areas as labeled cards (e.g. "What's Covered", "What's Excluded", "Deductibles & Limits", "How to File a Claim")

2. Q&A Interface
   - Below the summary, render a chat-style interface
   - The user can type questions about the policy (e.g. "Am I covered for water damage?" or "What is my out-of-pocket maximum?")
   - Each answer should cite the relevant policy section by name if possible
   - Maintain conversation history so follow-up questions retain context

3. Technical Stack
   - Frontend: Next.js with Tailwind CSS
   - AI: Anthropic Claude API (claude-sonnet-4-20250514) using the Documents API to pass the PDF directly
   - The full PDF content should be passed as context on every Q&A request
   - No backend database required — all state is in-memory for the session

4. UX Details
   - Clean, minimal interface appropriate for a financial services audience
   - Show a loading skeleton while the initial summary is being generated
   - Handle errors gracefully (unsupported file type, empty response, etc.)
   - Mobile-responsive layout

Deliverable: A working local dev environment with `npm run dev` as the start command.
```

---

## 1. Use Case

Insurance policies are long, dense, and written in legal language that most policyholders cannot easily parse. When people need to understand their coverage — before filing a claim, after a life event, or at renewal — they either call a support line, guess, or ignore the document entirely.

**Policy Explainer** gives any policyholder an instant, conversational interface to their own policy. Upload the PDF, ask a question in plain English, get a direct answer — with the source section cited.

Target users include:
- Individual policyholders reviewing home, auto, life, or health coverage
- Insurance agents preparing for client conversations
- Claims adjusters doing rapid coverage lookups
- Carriers building self-service tools to reduce inbound call volume

---

## 2. Solution

A lightweight single-page application where a user uploads a policy PDF and immediately receives:

1. **A plain-English summary** organized into digestible coverage cards (What's Covered, Exclusions, Limits & Deductibles, How to File a Claim)
2. **A persistent Q&A chat interface** that answers follow-up questions against the full policy document, with citations back to the relevant section

The PDF is passed directly to the Claude API using the Documents API — no chunking, no embeddings, no vector database. The full policy text is available as live context for every question in the session.

---

## 3. Product Experience

**Step 1 — Upload**
The user lands on a clean interface with a drag-and-drop zone and a single call to action: *"Upload your policy PDF to get started."*

**Step 2 — Summary Generation**
Within seconds of upload, four coverage cards populate on screen:
- ✅ **What's Covered** — key perils and protections in plain language
- 🚫 **What's Excluded** — common exclusions surfaced prominently
- 💰 **Limits & Deductibles** — dollar amounts and thresholds extracted and labeled
- 📋 **How to File a Claim** — the claims process summarized step-by-step

**Step 3 — Ask Anything**
Below the summary, a chat input lets the user ask natural language questions:
> *"If a tree falls on my roof, am I covered?"*
> *"Does this cover rental cars?"*
> *"What happens if I miss a premium payment?"*

Each response answers the question directly and cites the policy section it drew from (e.g., *"Per Section 4B — Additional Living Expenses…"*).

**Step 4 — Follow-Up**
The conversation retains context so the user can ask follow-up questions without re-stating their situation. The session resets on a new upload.

---

## 4. High-Level Technical Approach

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Single page, mobile-responsive |
| AI Model | Claude claude-sonnet-4-20250514 | Via Anthropic API |
| Document Handling | Anthropic Documents API | PDF passed as base64 per request |
| State Management | React `useState` | In-memory only, no persistence |
| Hosting (demo) | `localhost` / Vercel | `npm run dev` for hackathon |

**Key architectural decisions:**

- **No vector DB or chunking.** The full PDF is passed with every API call using Claude's native document support. This keeps the architecture simple and ensures no context is lost from splitting.
- **Prompt layering.** Two system prompts are used: one for the initial summary (structured output into coverage card format), one for the Q&A session (answer + cite section). Conversation history is appended on each Q&A call.
- **Stateless backend.** No user accounts, no storage. All session data lives in React state and is cleared on page refresh.

**API call pattern:**
```
[System prompt: "You are an insurance policy assistant..."]
[Document: <policy PDF as base64>]
[User: "What is my deductible for flood damage?"]
[Assistant: prior turns...]
[User: new question]
```

---

## 5. Business Value

**For Carriers & MGAs**
- Reduces inbound call volume for coverage questions — a top driver of policyholder service costs
- Can be embedded in self-service portals at renewal or post-purchase
- Reduces E&O risk by surfacing exclusions proactively rather than at claim time

**For Agents & Advisors**
- Gives producers an instant research tool for client meetings
- Speeds up coverage comparison across multiple policy documents
- Supports cross-sell conversations by surfacing coverage gaps

**For Policyholders**
- Replaces the experience of calling a 1-800 number to ask a simple coverage question
- Builds trust and transparency with the carrier
- Especially valuable at claim time, when confusion is highest and stakes are real

**Quantified opportunity:**
- Average insurance call center handles 60–80% coverage inquiry calls that could be deflected
- Self-service containment rates of 30–40% are achievable with well-designed AI tools
- For a mid-size carrier handling 500K annual service calls, even a 20% deflection rate represents millions in annual operational savings

---

*Prepared for internal hackathon use. One-hour build scope.*
