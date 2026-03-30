# BentoLab LinkedIn Content Strategy
> This file is the source of truth for Claude Code when generating, editing, or reviewing LinkedIn posts for the BentoLab project.
> When asked to write a post, always reference the full context below before generating any content.

---

## 1. Project Identity

### What Is BentoLab?
BentoLab (bentolab.io) is an open-source, self-hostable project management platform — think Jira, but simpler, more flexible, and built for real humans. It is being built as a serious portfolio-grade engineering project by a software engineering student.

**One-line pitch:**
> "An open-source project management tool — simple enough for a classroom, powerful enough for a real team, with native Hebrew and RTL support, that runs anywhere from a Raspberry Pi to the cloud."

### Core Differentiators (always reference these when writing posts)
1. **Genuinely self-hostable on minimal hardware** — runs on a Raspberry Pi 5 (~2.4GB RAM) using a lightweight SQLite deployment profile. This is a real architectural decision, not a marketing claim.
2. **Deployment-aware architecture from day one** — cloud, standard, and minimal (SQLite) profiles baked into config. Different databases, different auth options, all feature-flagged.
3. **Native Hebrew + Arabic RTL support** — full right-to-left layout, not an afterthought. Targets Israeli universities, bootcamps, and startups. No competing tool does this well.
4. **Built for education** — designed to be used in university and college courses: project management, software testing, system design, cloud, web development. A real tool for learning, not a simulation.
5. **Simpler than Jira** — lean core feature set. No feature bloat. Designed to be understood, not just used.
6. **Fully documented** — documentation written to teach, not just reference. Every architectural decision explained.
7. **Open source (AGPL-3.0)** — full transparency. Students can read the code, understand the system, fork it.
8. **High availability architecture** — microservices, Kafka, designed for resilience from day one, even if five-nines is a long-term goal.

### Target Audiences
| Audience | Pain They Feel | What Bento Solves |
|---|---|---|
| Developers & homelabbers | Jira is expensive and heavy | Free, lightweight, self-hostable |
| Students | Learning PM from slides, not real tools | A real tool designed for courses |
| Professors & instructors | No affordable real PM tool for classrooms | Free, self-hostable, simple to onboard |
| Israeli tech community | No professional tool with real Hebrew/RTL support | Native Hebrew + Arabic, built locally |
| Small teams & startups | Jira is overkill and overpriced | Lean, modern, affordable |

---

## 2. Author Identity (Always Write From This Perspective)

**Who is writing these posts:**
- Software engineering student
- Team leader at Magshim Cyber (a prestigious Israeli cyber education program) — leading 5 groups with 5 synergized related projects simultaneously
- Building BentoLab as a self-directed, production-grade engineering project
- Learning microservices, DevOps, and cloud architecture hands-on by actually building
- Not an expert teaching down — a builder sharing real decisions, real mistakes, real lessons
- Running a self-hosted GitLab CE instance on a Raspberry Pi 5 at home
- Uses: Java 25, Spring Boot 4.x, Gradle, PostgreSQL, MongoDB, Kafka, Docker, Docker Compose, React, TypeScript

**Voice & Tone Rules:**
- Always honest — never pretend to be more experienced than you are
- Technical but accessible — explain concepts, don't just name-drop them
- Curious and opinionated — share actual opinions on architectural decisions
- Israeli context is natural — mention Magshim, university context, Hebrew support without over-explaining
- Never corporate — no buzzword salads, no "excited to announce" energy
- Always end with a genuine question — to drive comments and engagement
- Posts should feel like a smart student talking to peers, not a LinkedIn influencer performing

---

## 3. Technical Stack Context (Reference When Writing Tech Posts)

### Backend
- **Language:** Java 25
- **Framework:** Spring Boot 4.x
- **Build tool:** Gradle
- **Architecture:** Microservices
- **Services:** `auth`, `org`, `board`, `notifications`, `api-gateway`
- **Databases:** PostgreSQL (per-service), MongoDB, SQLite (minimal profile)
- **Messaging:** Apache Kafka
- **Migrations:** Liquibase
- **Auth:** JWT validation at API gateway level only — downstream services receive `X-User-ID` and `X-Internal-Token` headers. No per-service JWT validation.
- **OAuth2:** Hybrid approach — custom auth core first, social login via `@ConditionalOnProperty` feature flags
- **Shared library:** `bento-security-commons`
- **Distributed transactions:** Saga pattern over Kafka

### Frontend
- **Framework:** React + TypeScript + Vite
- **Real-time:** WebSockets via STOMP (dedicated stateful WebSocket/gateway service consuming from Kafka)
- **i18n:** Full Hebrew and Arabic RTL support planned

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** Self-hosted GitLab CE on Raspberry Pi 5
- **Local server:** Raspberry Pi 5 (static IP `192.168.1.45`, SSH port 2222, container registry port 5050, accessible via `gitlab.lan`)
- **DNS:** Router-level DNS for `gitlab.lan` network-wide resolution
- **Future cloud:** AWS (Route 53, ACM, SES, ALB) with Terraform — deferred until closer to production
- **Domain:** bentolab.io (registered on Namecheap)
- **IDE:** IntelliJ IDEA on macOS

### Key Architectural Decisions Worth Mentioning in Posts
- API gateway handles all JWT validation — avoids duplicating security logic across services
- Database-per-service pattern for true service independence
- Kafka for async inter-service communication — decouples services, enables event sourcing
- Deployment profiles: `cloud`, `default`, `minimal` (SQLite for Pi deployment)
- `spring.mongodb.uri` not `spring.data.mongodb.uri` in Spring Boot 4
- GitLab Flow branching strategy

---

## 4. The Full LinkedIn Post Plan

### Overview
- **Total posts:** 17
- **Cadence:** 1 post per week
- **Duration:** 17 weeks
- **Format:** Mix of story posts, technical deep-dives, and engagement hooks (polls/questions)

---

## 5. Epics, Sprints & Tasks (BentoLab Project Structure)

> This section defines BentoLab as a project management project inside BentoLab itself.
> Each Epic maps to a content phase. Each Sprint is 2 weeks. Each Post is an Issue with its own tasks and assets.

---

### EPIC 1 — Plant the Flag
**Goal:** Establish author identity, introduce BentoLab concept, collect first market signal
**Sprint:** Sprint 1 (Weeks 1–2) + Sprint 2 (Weeks 3–4)
**Labels:** `awareness`, `story`, `hook`

---

#### Sprint 1 — Weeks 1–2

---

##### Issue 1.1 — Post: "Why I'm building my own Jira as a student"
**Type:** Story Post
**Week:** 1
**Labels:** `story`, `origin`, `awareness`

**Post Brief:**
This is the origin story. It must answer: who are you, what are you building, and why does it exist. The hook is the contrast between being a student AND being a team leader managing 5 real teams with real coordination challenges — and existing tools failing to handle that well.

**Key Points to Cover:**
- Leading 5 groups at Magshim Cyber with 5 synergized projects — real coordination complexity
- Tried existing tools (Jira too complex, Trello too simple, others not in Hebrew)
- Decided to build something that actually fits this use case
- BentoLab is born — open source, self-hostable, Hebrew-first, simple core
- Not just a portfolio project — a tool I actually want to use

**Opening Hook Options (pick one):**
- "I lead 5 teams simultaneously. Jira almost broke me."
- "I'm a student building my own Jira. Here's why that's not crazy."
- "Most students learn project management from slides. I decided to build the tool instead."

**Closing Question:**
"What tool do you use to manage team projects? What's the one thing it gets wrong?"

**Assets Needed:**
- [ ] Simple BentoLab logo (purple/amber on dark background, origami-inspired square divided into 4 triangles)
- [ ] Optional: Photo of Raspberry Pi setup or desk setup for authenticity
- [ ] Brand colors reference: primary purple, amber accent, dark background

**Character limit target:** 1200–1500 characters (LinkedIn sweet spot)

---

##### Issue 1.2 — Post: "What's your biggest frustration with Jira or Trello?" (Hook)
**Type:** Hook / Poll Post
**Week:** 2
**Labels:** `hook`, `market-research`, `poll`

**Post Brief:**
First market research hook. Short, punchy setup, then a poll. The goal is to get data on which pain point resonates most with your audience. Comments are gold — people will vent.

**Poll Options:**
- Too complex / overwhelming
- Too expensive for small teams
- No support for my language (Hebrew, Arabic, etc.)
- Bad UX / feels outdated

**Setup Copy Direction:**
Short paragraph about the frustration of choosing a PM tool — frame it as a universal problem. Don't mention BentoLab directly yet. Just validate the pain.

**Closing Line:**
"Building something about this. Comments appreciated."

**Data to Track After Post:**
- Winning poll option
- Any specific feature requests in comments
- Whether Hebrew/language option gets traction
- Commenter profiles (students? developers? PMs?)

**Assets Needed:**
- [ ] No image required — polls perform better without images on LinkedIn
- [ ] Optionally: a simple graphic showing "Jira complexity vs what you actually need" comparison chart

---

#### Sprint 2 — Weeks 3–4

---

##### Issue 2.1 — Post: "The architecture behind BentoLab"
**Type:** Technical Post
**Week:** 3
**Labels:** `tech`, `architecture`, `microservices`

**Post Brief:**
First technical post. Introduce the system architecture at a high level — not a deep dive, just enough to signal seriousness and spark curiosity. Show that this isn't a toy project.

**Key Points to Cover:**
- Why microservices over a monolith (as a student — the learning value + the scalability story)
- The main services: `auth`, `org`, `board`, `notifications`, `api-gateway`
- Database-per-service pattern — why each service has its own PostgreSQL
- Kafka as the async backbone between services
- Quick mention of deployment profiles (cloud vs Pi)
- Honest acknowledgment: microservices have overhead — but the tradeoffs are worth it for learning and future scale

**Opening Hook Options:**
- "Most students build a monolith. I chose microservices. Here's the honest tradeoff."
- "BentoLab has 5 backend services, 2 databases, and runs on a Raspberry Pi. Let me explain."

**Closing Question:**
"If you were starting a new project today — monolith or microservices? What's your reasoning?"

**Assets Needed:**
- [ ] Architecture diagram (simple, clean) showing: React frontend → API Gateway → [auth, org, board, notifications services] → [PostgreSQL instances, MongoDB, Kafka]
- [ ] Diagram style: dark background, purple/amber accent lines, clean boxes
- [ ] Tool to make diagram: draw.io, Excalidraw, or Mermaid rendered to image
- [ ] File format: PNG, 1200x627px (LinkedIn optimal)

---

##### Issue 2.2 — Post: "Name one professional tool with truly good Hebrew support. I'll wait." (Hook)
**Type:** Hook / Provocation Post
**Week:** 4
**Labels:** `hook`, `hebrew`, `rtl`, `israel`, `market-research`

**Post Brief:**
Provocation post targeting the Israeli tech community specifically. Do NOT mention BentoLab in the post itself — the goal is to validate the pain and collect comments. Drop a hint in the comments after engagement starts.

**Copy Direction:**
Single punchy statement. Then expand slightly — describe the experience of switching your system to Hebrew and watching half the UI break. Ask the community to name a tool that actually does this right. Wait for the silence.

**Comment Strategy:**
After 10–20 comments, reply with: "Yeah. Building something about this. Stay tuned — bentolab.io"

**Data to Track After Post:**
- Which tools get named (your competitive landscape)
- How many people engage vs just react (engagement depth)
- Any professors, instructors, or team leads in the comments

**Assets Needed:**
- [ ] Optional: Screenshot mockup of a broken RTL UI (blurred/generic, not a real product attack)
- [ ] Or: Simple graphic — Hebrew text rendering correctly vs broken in a UI

---

### EPIC 2 — Build Credibility
**Goal:** Demonstrate real technical depth, attract developer and homelab audience, collect feature preference data
**Sprint:** Sprint 3 (Weeks 5–6) + Sprint 4 (Weeks 7–8) + Sprint 5 (Week 9)
**Labels:** `tech`, `devops`, `hook`

---

#### Sprint 3 — Weeks 5–6

---

##### Issue 3.1 — Post: "Self-hosting GitLab CE on a Raspberry Pi — what nobody tells you"
**Type:** Technical Deep-Dive Post
**Week:** 5
**Labels:** `tech`, `gitlab`, `self-hosted`, `raspberry-pi`, `docker`

**Post Brief:**
This is your highest potential reach post in Phase 2. Self-hosting GitLab on a Pi is something thousands of developers want to do and very few have documented from real experience. Be specific — real commands, real gotchas, real numbers.

**Key Points to Cover:**
- Hardware: Raspberry Pi 5, why it works (just enough RAM with tuning)
- Docker Compose setup for GitLab CE
- Critical memory tuning — without this it will crash (puma workers, sidekiq concurrency)
- SSH on non-standard port (2222) — why and how
- Container registry on port 5050 — using it as a private Docker registry for BentoLab images
- Router-level DNS for `gitlab.lan` — how to set up network-wide resolution without editing every hosts file
- GitLab Flow branching strategy — why it fits solo/small team dev better than GitFlow

**Real Config Details to Include (from your actual setup):**
- Static IP: `192.168.1.45`
- SSH port: `2222`
- Container registry: port `5050`
- Hostname: `gitlab.lan`

**Opening Hook Options:**
- "I run my own GitLab. On a Raspberry Pi. In my bedroom. Here's everything that went wrong."
- "GitLab CE on a Pi costs €0/month. Here's the full setup — including the parts that broke."

**Closing Question:**
"Do you self-host any dev tools? What's in your homelab?"

**Assets Needed:**
- [ ] Photo of actual Raspberry Pi 5 setup (authentic, performs well on LinkedIn)
- [ ] Docker Compose snippet screenshot (syntax highlighted, dark theme)
- [ ] Optional: Network diagram showing Pi → router → `gitlab.lan` DNS resolution
- [ ] File format: PNG, 1200x627px

---

##### Issue 3.2 — Post: "Would you self-host your PM tool if setup took under 10 minutes?" (Hook)
**Type:** Hook / Poll Post
**Week:** 6
**Labels:** `hook`, `market-research`, `self-hosted`, `poll`

**Poll Options:**
- Yes — I already self-host tools
- Yes — if the docs are good
- No — I'd rather pay for managed
- Depends on the tool

**Setup Copy Direction:**
Short setup about the trade-off between SaaS convenience and data ownership/cost. Frame it as a genuine question you're thinking about while building BentoLab. Don't oversell.

**Data to Track:**
- Ratio of self-hosters vs managed preference
- Whether "docs are good" option wins — validates your documentation NFR
- Comments about what tools people already self-host

**Assets Needed:**
- [ ] Simple graphic: "Your server vs their server" — cost/control comparison visual

---

#### Sprint 4 — Weeks 7–8

---

##### Issue 4.1 — Post: "Docker Compose lessons nobody tells you"
**Type:** Technical Post
**Week:** 7
**Labels:** `tech`, `docker`, `devops`, `lessons-learned`

**Post Brief:**
Practical, honest lessons from running a multi-service Docker Compose setup for BentoLab. Real gotchas, not textbook content.

**Key Points to Cover:**
- `localhost` inside a container is NOT your host machine — use service names (e.g., `kafka:9092` not `localhost:9092`). This one catches everyone.
- Liquibase running inside a container and hitting DB connection timing issues — use `depends_on` with health checks, not just `depends_on`
- Network isolation — services in the same Compose file share a network by default, but named networks give you more control
- Environment variable management — `.env` files, never hardcode credentials
- Volume naming matters — anonymous volumes get messy fast, always name your volumes
- The `restart: unless-stopped` policy — why you want this on your Pi setup

**Opening Hook Options:**
- "I spent 3 hours debugging why my service couldn't connect to Kafka. The answer was one word: localhost."
- "Docker Compose looks simple. Then you run 6 services together."

**Closing Question:**
"What's the Docker gotcha that cost you the most time? Drop it in the comments."

**Assets Needed:**
- [ ] Code snippet image: correct vs incorrect service hostname in Docker Compose (dark theme, syntax highlighted)
- [ ] Optional: Compose file excerpt showing health check pattern for Liquibase/DB dependency

---

##### Issue 4.2 — Post: "If you could design your ideal PM tool — what's the ONE feature that must exist on day one?" (Hook)
**Type:** Hook / Open Question Post
**Week:** 8
**Labels:** `hook`, `market-research`, `feature-discovery`

**Post Brief:**
Open-ended question. No poll — force people to write comments. This is your richest source of feature data.

**Copy Direction:**
Short setup: "I'm building a project management tool. Before I lock the roadmap, I want to ask the people who will use it." Then the question. That's it. Keep it under 300 characters so the question is the focus.

**Comment Engagement Strategy:**
Reply to every comment. Ask follow-up questions. This signals to the LinkedIn algorithm to keep pushing the post. Every reply from you = more reach.

**Data to Track:**
- List every feature mentioned, even once
- Cluster by theme: collaboration, notifications, integrations, simplicity, reporting, etc.
- Note which features get liked by others in comments (social proof of importance)

**Assets Needed:**
- [ ] No image needed — open question posts perform best as text-only on LinkedIn

---

#### Sprint 5 — Week 9

---

##### Issue 5.1 — Post: "How I handle auth across microservices in BentoLab"
**Type:** Technical Deep-Dive Post
**Week:** 9
**Labels:** `tech`, `auth`, `microservices`, `security`, `spring-boot`

**Post Brief:**
Explain the JWT + API gateway auth architecture. This is a genuinely interesting architectural decision that many developers face. Be opinionated — explain why you chose this approach over alternatives.

**Key Points to Cover:**
- The problem: you have 5 services — do you validate JWT in each one?
- The answer: No. API Gateway handles all JWT validation
- Downstream services receive `X-User-ID` and `X-Internal-Token` headers — they trust the gateway
- The `bento-security-commons` shared library — what it does and why it's a shared lib not duplicated code
- The hybrid OAuth2 approach: `@ConditionalOnProperty` — social login is a feature flag, not core requirement
- Why this is more secure than per-service validation (single point of truth for auth logic)
- The tradeoff: gateway becomes a critical path — how you handle that

**Opening Hook Options:**
- "5 microservices. 1 JWT. Here's why only 1 of them validates it."
- "Per-service JWT validation sounds secure. It's actually a maintenance nightmare."

**Closing Question:**
"How do you handle auth in a microservices setup? Centralized or per-service?"

**Assets Needed:**
- [ ] Diagram: Request flow — Client → API Gateway (JWT validated here) → downstream services (X-User-ID header only)
- [ ] Dark background, clear arrows, service boxes labeled
- [ ] Optional: Code snippet of `@ConditionalOnProperty` for OAuth2 feature flag

---

### EPIC 3 — The Academic Angle
**Goal:** Open the education market conversation, validate academic use case, attract professors and students
**Sprint:** Sprint 6 (Weeks 10–11) + Sprint 7 (Weeks 12–13)
**Labels:** `education`, `academic`, `hook`, `vision`

---

#### Sprint 6 — Weeks 10–11

---

##### Issue 6.1 — Post: "Why universities teach project management with PowerPoints instead of real tools"
**Type:** Story / Opinion Post
**Week:** 10
**Labels:** `education`, `opinion`, `academic`, `awareness`

**Post Brief:**
Provocative opinion piece targeting the academic world. The argument: students graduate having "learned" project management but never having actually used a real PM tool in a realistic way. This is a systemic problem and it's fixable.

**Key Points to Cover:**
- Describe the typical university PM course experience — theory, slides, maybe a simplified Trello board
- The gap between classroom and real teams (referencing Magshim experience — real teams, real complexity)
- Why existing tools aren't used in classrooms: too expensive, too complex to onboard 30 students, no good Hebrew support for Israeli courses
- What a tool designed for teaching would look like: simple setup, sandboxed environments, good docs, free
- Teaser: "I'm building that tool"

**Opening Hook Options:**
- "My university taught me project management. I led 5 real teams at Magshim. They had nothing in common."
- "Students spend 4 years learning about Scrum. Most have never actually used a real PM tool."

**Closing Question:**
"Did your university/college use real tools in PM or software courses? What was the experience?"

**Assets Needed:**
- [ ] Graphic: Side-by-side — "What university teaches" (slide with Gantt chart) vs "What real teams use" (PM tool screenshot)
- [ ] Keep it clean and not mocking — it's a systemic problem, not a blame game

---

##### Issue 6.2 — Post: "If your course used a real PM tool instead of theory — would you learn better?" (Hook)
**Type:** Hook / Poll Post
**Week:** 11
**Labels:** `hook`, `education`, `market-research`, `poll`

**Poll Options:**
- Yes, definitely
- Probably, depends on the tool
- No, theory is enough
- I've already used real tools in courses

**Additional Question in Post Body:**
"If yes — which course would benefit most? (comment below)"
- Project Management
- Software Testing
- System Design
- Cloud / DevOps
- Web Development

**Data to Track:**
- Poll result breakdown
- Which courses get mentioned most in comments
- Any professors or instructors engaging
- Any universities or course names mentioned

**Assets Needed:**
- [ ] Optional: Simple graphic listing course types with a question mark visual

---

#### Sprint 7 — Weeks 12–13

---

##### Issue 7.1 — Post: "What if your PM tool was also a teaching tool?"
**Type:** Vision Post
**Week:** 12
**Labels:** `vision`, `education`, `product`, `bentolab`

**Post Brief:**
First time explicitly connecting BentoLab to the academic use case. Reveal the vision clearly. This post should feel like a manifesto — short, clear, and memorable.

**Key Points to Cover:**
- The vision: one tool that works for real teams AND for classrooms
- What makes it work for teaching: simple UI, self-hostable for a whole class, full docs written to explain not just reference, free
- What makes it work for real teams: microservices backend, real-time collaboration, full feature set
- Hebrew and RTL support — first tool to do this properly for Israeli institutions
- Open source — professors and students can read the code, understand the system, contribute
- It runs on a Pi — a university can run it on a €60 computer

**Opening Hook Options:**
- "What if the tool you learned on in university was also the tool you used at your first job?"
- "I'm building a PM tool for real teams. But also for classrooms. Here's why that's the same thing."

**Closing Question:**
"If you were teaching a software engineering course — what would you want students to learn from a real PM tool?"

**Assets Needed:**
- [ ] BentoLab logo — clean version on dark background
- [ ] Optional: Split visual — "For teams" / "For classrooms" showing same tool, same features

---

##### Issue 7.2 — Post: "As a student managing a team project — what broke down first?" (Hook)
**Type:** Hook / Poll Post
**Week:** 13
**Labels:** `hook`, `students`, `market-research`, `poll`

**Poll Options:**
- Communication between members
- Task tracking / who does what
- Missing deadlines
- Unclear project scope from the start

**Setup Copy Direction:**
Speak directly to students. "You've been there. Group project. Semester deadline. Something breaks." Keep it short and relatable.

**Data to Track:**
- Which breakdown type wins
- Comments from students describing specific experiences
- Any patterns that map to BentoLab features (e.g., if "unclear scope" wins → BentoLab needs strong epic/story hierarchy)

**Assets Needed:**
- [ ] Relatable meme-style graphic optional (group project chaos visual) — keep it professional

---

### EPIC 4 — Community & Pre-Launch
**Goal:** Build waitlist and community, show personal depth, set up launch moment
**Sprint:** Sprint 8 (Weeks 14–15) + Sprint 9 (Weeks 16–17)
**Labels:** `pre-launch`, `story`, `hook`, `vision`

---

#### Sprint 8 — Weeks 14–15

---

##### Issue 8.1 — Post: "What Magshim taught me about software architecture"
**Type:** Story / Insight Post
**Week:** 14
**Labels:** `story`, `leadership`, `architecture`, `magshim`

**Post Brief:**
Bridge post connecting leadership experience to technical decisions. This is a unique angle — most developers talk about code. You talk about what leading 5 real teams taught you about building systems. Highly shareable.

**Key Points to Cover:**
- What Magshim is (briefly — a national cyber education program in Israel, team leading 5 groups with 5 synergized projects)
- The parallel: managing 5 teams with interdependencies = thinking about microservices
- Lessons from team leadership that map to architecture:
  - Teams need clear contracts (APIs)
  - Communication overhead grows non-linearly (Kafka for async)
  - Independent teams need independent deployments (database-per-service)
  - Shared knowledge is a bottleneck (avoid shared databases)
- How BentoLab's architecture reflects these real lessons
- Being a student who leads real teams = seeing both sides

**Opening Hook Options:**
- "Leading 5 teams taught me more about microservices than any course."
- "The best systems and the best teams share one thing: clear contracts and loose coupling."

**Closing Question:**
"What's a non-technical lesson that changed how you write code?"

**Assets Needed:**
- [ ] Optional: Team/leadership themed visual — abstract network of nodes showing connections
- [ ] Or: Simple quote card with the opening hook line — clean, dark background, BentoLab branding

---

##### Issue 8.2 — Post: "What would you actually pay for a PM tool your whole team loves?" (Hook)
**Type:** Hook / Poll Post
**Week:** 15
**Labels:** `hook`, `market-research`, `pricing`, `poll`

**Poll Options:**
- Nothing — must be free / open source
- Under $5/user/month
- Under $10/user/month
- Price doesn't matter if it's genuinely good

**Setup Copy Direction:**
Honest framing: "I'm figuring out the business model for BentoLab. Transparency: I want to know what people actually pay vs what they say they'd pay." This honesty about the purpose of the question will get more honest answers.

**Data to Track:**
- Poll distribution — critical for business model decisions
- Whether "free/open source" dominates (suggests self-hosted community focus)
- Comments about willingness to pay for support vs software

**Assets Needed:**
- [ ] Simple graphic: pricing tier comparison (free self-hosted vs managed cloud)

---

#### Sprint 9 — Weeks 16–17

---

##### Issue 9.1 — Post: "BentoLab roadmap — here's where we're going"
**Type:** Vision / Roadmap Post
**Week:** 16
**Labels:** `vision`, `roadmap`, `product`, `bentolab`

**Post Brief:**
Lay out the full vision and roadmap. Be specific about what's built, what's next, and what the long-term looks like. This post signals seriousness and invites people to follow the journey.

**Key Points to Cover:**
- What's built so far: microservices backbone, auth, org service, board service, Kafka, Docker Compose setup, GitLab CI/CD
- What's coming next: frontend, real-time collaboration (WebSockets/STOMP), full Hebrew/RTL support, documentation site
- Deployment options: self-hosted (Pi-ready), cloud (AWS with Terraform/Route 53/ALB), managed cloud (future)
- The academic track: documentation written to teach, classroom-ready deployment
- Open source forever: AGPL-3.0
- Long-term: bentolab.io as a managed cloud option, with full self-hosted always free

**Opening Hook Options:**
- "Here's everything I'm building — and why it will take exactly as long as it takes."
- "BentoLab roadmap: what's done, what's next, and what I'm still figuring out."

**Closing Question:**
"What would make you follow a project from day one? What would make you actually use it when it launches?"

**Assets Needed:**
- [ ] Roadmap graphic — timeline or kanban-style visual
  - Column 1: Built ✓ (auth, org, board, Kafka, Docker, GitLab CI)
  - Column 2: In Progress (frontend, WebSockets, RTL)
  - Column 3: Planned (docs site, AWS infra, managed cloud)
- [ ] Dark background, purple/amber brand colors

---

##### Issue 9.2 — Post: "BentoLab is coming — follow the journey"
**Type:** Launch / CTA Post
**Week:** 17
**Labels:** `launch`, `cta`, `pre-launch`, `community`

**Post Brief:**
Soft launch post. No hard sell. Invite people to follow the journey — GitHub star, LinkedIn follow, or email interest. The tone is humble and genuine, not a product launch announcement.

**Key Points to Cover:**
- Quick summary of the journey: started from a real problem at Magshim, built in public for 17 weeks, here's what it became
- What BentoLab is (one paragraph, use the one-line pitch)
- How to follow:
  - GitHub repo (link)
  - bentolab.io (link — even if just a landing page)
  - LinkedIn follow for updates
- What's coming: public beta, documentation, academic pilot
- Honest note: it's not ready yet — but it will be, and you'll document every step

**Opening Hook Options:**
- "17 weeks ago I started building. Here's where BentoLab stands today."
- "I've been building in public. Here's what I'm building — and how to follow along."

**Closing Question:**
"What kind of content has been most useful to you over these past weeks? What should I keep covering?"

**Assets Needed:**
- [ ] BentoLab logo — best version, polished
- [ ] Landing page screenshot of bentolab.io (even a simple coming soon page)
- [ ] Optional: Collage of all 17 posts visually — showing the journey

---

## 6. Asset Master List

All visual assets needed across all posts. Create these before the sprint that needs them.

| Asset | Used In | Format | Notes |
|---|---|---|---|
| BentoLab logo (dark bg) | Posts 1, 12, 17 | PNG 1200x627 | Purple/amber, origami square |
| Architecture diagram | Post 3 | PNG 1200x627 | React→Gateway→Services→DBs |
| Broken RTL UI mockup | Post 4 | PNG | Generic, not targeting real product |
| Raspberry Pi photo | Post 5 | JPG | Authentic photo of actual Pi |
| Docker Compose snippet | Post 7 | PNG | Dark theme, syntax highlighted |
| Auth flow diagram | Post 9 | PNG 1200x627 | Client→Gateway→Services with headers |
| University vs real PM visual | Post 10 | PNG 1200x627 | Side by side comparison |
| BentoLab logo (clean) | Post 12 | PNG | Polished version |
| Quote card (Magshim lesson) | Post 14 | PNG | Dark bg, branded |
| Pricing tier visual | Post 15 | PNG | Free vs managed comparison |
| Roadmap graphic | Post 16 | PNG 1200x627 | Built/In Progress/Planned columns |
| Launch visual | Post 17 | PNG 1200x627 | Best logo + bentolab.io |

---

## 7. Data Tracking Template

After each hook post, record results here:

### Hook 1 (Week 2) — Pain Points Poll
- Winning option:
- Total votes:
- Key comment themes:
- Notable commenters (role/company):
- Feature requests mentioned:

### Hook 2 (Week 4) — Hebrew Support Provocation
- Tools named in comments:
- Engagement depth (comments vs reactions):
- Notable commenters:
- Competitive tools to watch:

### Hook 3 (Week 6) — Self-Host Poll
- Winning option:
- Self-hosters vs managed ratio:
- Tools people already self-host:

### Hook 4 (Week 8) — Feature Priority (Open Question)
- All features mentioned (list every one):
- Top 5 by mention count:
- Features with social proof (liked by others):
- Surprises:

### Hook 5 (Week 11) — Academic Poll
- Poll result:
- Top courses mentioned:
- Any professors/instructors in comments:
- Universities mentioned:

### Hook 6 (Week 13) — Student Breakdown Poll
- Winning breakdown type:
- Feature implications for BentoLab:

### Hook 7 (Week 15) — Pricing Poll
- Winning option:
- Free vs paid ratio:
- Comments on willingness to pay for support:
- Business model implications:

---

## 8. Instructions for Claude Code

When asked to write a LinkedIn post for BentoLab, follow this process:

1. **Identify the post number and type** from Section 5 above
2. **Read the full Issue brief** for that post — every bullet point should inform the content
3. **Apply the Author Identity** from Section 2 — voice, tone, honesty, student perspective
4. **Reference the Technical Stack** from Section 3 if it's a tech post — use real details
5. **Use the Differentiators** from Section 1 — always connect back to what makes Bento unique
6. **Target the right audience** from the Audiences table in Section 1
7. **Follow the character target** — aim for 1200–1500 characters for story/tech posts, under 500 for hook posts
8. **Always end with the closing question** specified in the Issue
9. **List the assets needed** as a checklist at the end of your output
10. **Never write a generic post** — every post should feel like it could only have been written by this specific person about this specific project

**Format your output as:**
```
POST TITLE: [title]
WEEK: [week number]
TYPE: [Story / Tech / Hook / Vision]
CHARACTER COUNT: [approximate]

---

[POST CONTENT]

---

ASSETS NEEDED FOR THIS POST:
- [ ] asset 1
- [ ] asset 2

HOOK DATA TO TRACK (if hook post):
- 
```
