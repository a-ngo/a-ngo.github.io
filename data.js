/**
 * data.js — knowledge base + routing tables for the scripted agent.
 *
 * Pure content: this is the file to edit to change what the agent says. The
 * engine that consumes it (route, submit, …) lives in app.js, which loads after
 * this file and reads these top-level constants directly.
 *
 * All answers are written in the third person ("Anthony is…").
 */

/**
 * One intent the agent can answer. Edit/extend the KB array freely.
 * @typedef {Object} KBEntry
 * @property {string} id - Unique identifier; also the key EXACT, SECTION, and
 *   NEXT use to refer back to this intent.
 * @property {string[]} k - Trigger keywords matched against the question. Avoid
 *   apostrophes and ultra-short words like "hi" here — put those in EXACT.
 * @property {string} src - The "retrieved source" label shown during retrieval.
 * @property {string} a - The answer text (third person).
 */

/** The knowledge base: every intent the agent can match and answer. @type {KBEntry[]} */
const KB = [
  {
    id: "who", src: "profile/about",
    k: ["who is", "background", "summary", "yourself", "himself", "anthony", "short bio", "biography", "intro", "overview", "profile", "about anthony", "about him"],
    a: "Anthony is an AI/ML engineer with a Dr.-Ing. and around eight years of experience. He started in autonomous-driving perception at Bosch, moved into LLM and agentic AI there, and now builds agentic AI systems at Deutsche Börse. The thread through his work is taking research-grade methods and making them hold up in production."
  },

  {
    id: "now", src: "experience/deutsche-borse",
    k: ["now", "current", "currently", "deutsche", "borse", "börse", "db", "capital markets", "exchange", "present job", "today", "current role", "what does he do now", "where does he work", "work now", "day job", "present role", "his job"],
    a: "He's an AI/ML Engineer at Deutsche Börse, building agentic AI for capital markets, with a strong emphasis on reliability, evaluation, and guardrails given the regulated domain."
  },

  {
    id: "bosch", src: "experience/bosch",
    k: ["bosch", "previous", "past", "before", "prior", "autonomous", "driving", "automotive", "self driving", "simulation", "sensor", "lidar", "radar", "perception", "robert bosch", "old job", "former", "stuttgart"],
    a: "Before Deutsche Börse, Anthony spent roughly seven years with Robert Bosch in Stuttgart, in two phases. He started with a three-year PhD (University of Stuttgart, in collaboration with Bosch) on autonomous-driving perception: CNN-based point cloud classification, object detection and tracking, and pipelines for large-scale real and synthetic sensor data, which produced peer-reviewed papers and two patents. He then moved into AI software engineering, building LLM and agentic systems: an LLM-based reporting pipeline that cut report time from hours to minutes, a RAG interface letting engineers query around 10,000 nightly simulation scenarios in natural language with RAGAS evaluation, and an MCP server exposing simulation tools to LLM agents that was adopted by hundreds of developers."
  },

  {
    id: "research", src: "research/themes",
    k: ["research", "academic", "radar simulation", "point cloud", "synthetic data", "simulation to reality", "sim to real", "research topics", "research areas", "what does he research", "research focus", "sensor model", "sensor models"],
    a: "His research centers on radar simulation and perception for virtual testing of autonomous driving: validating radar simulation, measuring the simulation-to-reality gap, evaluation metrics for simulated point clouds, synthetic sensor data, and object detection and tracking. The Publications section on this page lists the key papers, and his Google Scholar profile is the most complete source."
  },

  {
    id: "papers", src: "research/publications",
    k: ["paper", "papers", "publication", "publications", "published", "scholar", "cite", "citations", "peer reviewed", "which papers", "what did he publish", "list of papers", "his papers", "what has he published"],
    a: "He has peer-reviewed publications from his Bosch years, mostly on radar simulation for autonomous driving: a multi-layered approach for measuring the simulation-to-reality gap (ITSC 2021), a deep evaluation metric for simulated radar point clouds (RadarConf 2021), and a sensitivity analysis for radar simulation (ACIRS 2020). They're listed with links in the Publications section, and Google Scholar has the full record."
  },

  {
    id: "patents", src: "research/patents",
    k: ["patent", "patents", "intellectual property", "invention", "inventions", "patented"],
    a: "Anthony holds two patents from his Bosch research: one on providing a high-resolution digital map (DE102020206641A1) and one on evaluating a sensor model and training a recognition algorithm (DE102022206347A1). The Publications section links to his Google Patents inventor profile."
  },

  {
    id: "dissertation", src: "research/dissertation",
    k: ["dissertation", "thesis", "phd thesis", "doctoral thesis", "phd topic", "phd about", "what was his phd", "phd thesis about", "thesis topic", "radar simulation validation"],
    a: "His doctoral dissertation (Dr.-Ing., University of Stuttgart, 2023, in collaboration with Bosch) is a methodology for validating radar simulation for virtual testing of autonomous driving: how to measure whether simulated sensor data is realistic enough to trust for testing. It's linked at the top of the Publications section."
  },

  {
    id: "education", src: "profile/education",
    k: ["study", "studied", "studies", "education", "university", "degree", "doctorate", "phd", "dr ing", "dr-ing", "where did he study", "academic background", "diploma", "qualification", "darmstadt", "tu darmstadt", "mechanical engineering", "bachelor", "master", "masters", "undergrad", "grade", "grades", "buffalo"],
    a: "Anthony studied mechanical engineering at TU Darmstadt, earning both a B.Sc. and an M.Sc. (with a semester abroad at SUNY Buffalo). He then earned his Dr.-Ing., the German doctorate in engineering, at the University of Stuttgart, completed in collaboration with Bosch and graded magna cum laude. That three-year PhD, on radar simulation for autonomous driving, is where his deep ML foundation and his first years of professional experience come from."
  },

  {
    id: "certifications", src: "profile/certifications",
    k: ["certification", "certifications", "certificate", "certified", "courses", "course", "udemy", "udacity", "nanodegree", "training", "continuing education"],
    a: "Beyond his degrees, Anthony keeps current with focused training in modern AI engineering: Udemy courses in LLM Engineering, Agentic AI Engineering, and AI Engineering MLOps (2025), plus Udacity nanodegrees in ML DevOps (2024) and Deep Learning (2023)."
  },

  {
    id: "career", src: "profile/career-move",
    k: ["why finance", "career change", "automotive to finance", "cars to finance", "move to finance", "moved to finance", "into finance", "why did he move", "why move", "why switch", "why did he switch", "why leave", "why deutsche", "change industry", "industry switch", "transition", "career switch", "from automotive"],
    a: "He moved from automotive to capital markets because the interesting problem moved. The hard part, building ML systems that stay reliable under real-world constraints, carries straight over. What changed is the material: from sensor data and perception to financial data and agentic workflows."
  },

  {
    id: "experience", src: "profile/experience",
    k: ["experience", "experiences", "professional experience", "work experience", "academic experience", "work history", "employment history", "industry experience", "career path", "his career", "career so far", "track record", "journey", "experience overview", "tell me about his experience", "professional background"],
    a: "Anthony's path runs from research to applied AI. Academically, he studied mechanical engineering at TU Darmstadt, then earned a Dr.-Ing. at the University of Stuttgart in collaboration with Bosch. Professionally, around eight years in total: it began with that three-year PhD and continued at Bosch as a Software Engineer, and today he's an AI/ML Engineer at Deutsche Börse building agentic AI for capital markets. Ask about his time at Bosch, his current role, or his research for more detail."
  },

  {
    id: "voyager", src: "projects/voyager",
    k: ["voyager", "portfolio app", "portfolio manager", "investment app", "stocks", "tax helper", "dashboard", "finance app", "money app", "why voyager", "voyager name", "why is it called voyager", "name mean"],
    a: "Voyager is a self-hostable personal portfolio manager he's building. It imports broker CSVs, answers natural-language questions about your holdings, includes German tax helpers, and has a customizable widget dashboard. Stack is Next.js, TypeScript, FastAPI, and Docker. The name nods to the Voyager missions, to the moon and beyond: the idea of always exploring further, which fits growing a portfolio over the long run."
  },

  {
    id: "readit", src: "projects/read-it-later",
    k: ["read it later", "read-it-later", "content app", "reading app", "bookmark", "save articles", "readwise", "pocket", "instapaper"],
    a: "A planned project: an AI-powered read-it-later and content app that would capture long-form reading, summarize it, and resurface it later with LLM-assisted organization. It's on his roadmap, not yet started."
  },

  {
    id: "figure", src: "projects/talking-figure",
    k: ["action figure", "optimus", "prime", "transformer", "talking figure", "talking toy", "hardware project", "robot toy", "talking action"],
    a: "A planned side project: a DIY talking action figure that would run a local LLM on edge hardware, exploring on-device speech and personality. It's a hardware build he has in mind, not yet started."
  },

  {
    id: "heimdall", src: "projects/heimdall",
    k: ["heimdall", "h7ai", "job matching", "job match", "matching app", "job intelligence", "job search", "agentic rag", "rag project", "learning project", "why heimdall", "heimdall name", "why is it called heimdall"],
    a: "Heimdall AI is an agentic RAG job-intelligence platform he built. It uses a LangGraph pipeline with hybrid retrieval (keyword, semantic, and RRF fusion), LLM-based query routing and relevance grading (LLM-as-a-judge) with automatic query rewriting, and an autonomous web-crawling pipeline for job discovery. He evaluated it with a RAGAS-inspired harness measuring Precision@K, Recall@K, and MRR. Stack: Python, LangGraph, LangChain, FastAPI, and React. The name comes from Heimdall, the Norse watchman who oversees all: the agent watches the job market to spot the roles that match his dream job."
  },

  {
    id: "projects", src: "projects/index",
    k: ["projects", "building", "side project", "side projects", "what is he building", "what does he build", "work on", "builds", "things he made", "apps he made"],
    a: "Voyager, a self-hostable portfolio manager, is what he's actively building right now. Heimdall AI, an agentic RAG job-intelligence platform, he built to sharpen his retrieval and agent skills. A read-it-later app and a talking action figure with a local LLM are planned but not yet started. Ask about any one of them by name for detail."
  },

  {
    id: "proglang", src: "profile/programming-languages",
    k: ["programming language", "programming languages", "coding language", "coding languages", "code in", "codes in", "programming", "coding", "python", "c++", "cpp", "sql", "which language does he code", "what does he code in"],
    a: "He codes primarily in Python and C++, both with 8+ years of experience, and is also proficient in SQL."
  },

  {
    id: "stack", src: "profile/stack",
    k: ["stack", "tech stack", "tech", "technologies", "tools", "toolset", "skills", "skill set", "frameworks", "what does he use", "tooling", "libraries", "aws", "azure", "terraform", "langchain", "crewai", "mcp", "ragas", "mlflow"],
    a: "Programming: Python and C++ (both 8+ years), plus SQL. On the AI side: PyTorch, LangChain, LangGraph, and CrewAI; RAG and retrieval with RAGAS evaluation; MCP for tool-using agents; generative and agentic AI, plus MLOps. For building and shipping: FastAPI, Pydantic, MLflow, Docker, and Terraform, across AWS (Bedrock, Lambda, SageMaker), Azure, and GCP."
  },

  {
    id: "agentic", src: "explainer/agentic-ai",
    k: ["what is agentic", "agentic ai", "what are agents", "ai agents", "multi agent", "what does agentic mean", "agent system", "agent systems", "agentic systems"],
    a: "Agentic AI means LLM systems that don't just answer once. They plan, call tools, check their own output, and take multi-step actions toward a goal. That's the core of Anthony's work at Deutsche Börse: building agent systems wrapped in evaluation and guardrails so they hold up in a regulated setting."
  },

  {
    id: "rag", src: "explainer/rag",
    k: ["what is rag", "retrieval augmented", "explain rag", "rag mean", "rag pipeline", "how does rag work", "retrieval augmented generation"],
    a: "RAG, retrieval-augmented generation, grounds a model's answers in retrieved source material instead of leaving it to recall things from memory. Anthony builds RAG systems so they answer from real data. The little agent you're using right now is a tiny example: it retrieves from a knowledge base before it replies."
  },

  {
    id: "whyhire", src: "profile/strengths",
    k: ["why hire", "why should", "what makes him", "makes him different", "stand out", "standout", "strengths", "strength", "good at", "what is he good at", "unique", "differentiator", "best at", "selling point"],
    a: "Two things: depth and range. Depth from eight years building research-grade ML for demanding production environments. Range from working both ends, low-level perception and sensor modeling on one side, high-level agentic LLM systems on the other. He's at home both where the research is unproven and where the system just has to work."
  },

  {
    id: "years", src: "profile/seniority",
    k: ["how long", "years of experience", "how experienced", "seniority", "how senior", "how many years", "experience level", "tenure"],
    a: "Around eight years of professional experience, including a three-year PhD done in collaboration with Bosch. Most of it was R&D in autonomous driving at Bosch, and now AI engineering at Deutsche Börse."
  },

  {
    id: "interests", src: "profile/interests",
    k: ["hobby", "hobbies", "interests", "outside work", "free time", "personal life", "football", "soccer", "gym", "fitness", "strategy games", "gaming", "sports", "off the clock"],
    a: "Outside work he's into fitness and football, strategy games, and hands-on building. His side projects tend to blur into engineering; the DIY talking action figure is a good example of that."
  },

  {
    id: "reading", src: "profile/reading",
    k: ["reading", "book", "books", "what is he reading", "what books", "currently reading", "empire of ai", "anxious generation", "karen hao", "haidt", "reading list"],
    a: "Right now he's reading Empire of AI by Karen Hao and The Anxious Generation by Jonathan Haidt. Both are linked in the Now section near the bottom of the page."
  },

  {
    id: "languages", src: "profile/languages",
    k: ["language", "languages", "spoken language", "spoken languages", "spoken", "speak", "speaks", "fluent", "native", "german speaker", "english", "vietnamese", "spanish", "bilingual", "what languages does he speak", "what languages", "does he speak"],
    a: "Spoken languages: he's a native German and Vietnamese speaker, works fluently in English, and has beginner Spanish."
  },

  {
    id: "remote", src: "profile/work-setup",
    k: ["remote", "relocate", "relocation", "onsite", "on-site", "hybrid", "work from home", "wfh", "willing to relocate", "remote work", "in office", "commute"],
    a: "He's based in the Frankfurt area. For specifics on remote, hybrid, or relocation, the best move is to ask him directly by email."
  },

  {
    id: "location", src: "profile/location",
    k: ["where is he", "where does he live", "location", "based", "lives", "city", "country", "germany", "frankfurt", "what area"],
    a: "He's based in the Frankfurt area in Germany."
  },

  {
    id: "cv", src: "profile/cv",
    k: ["cv", "resume", "curriculum vitae", "lebenslauf", "download cv", "his cv", "his resume", "get his cv"],
    a: "He keeps this site light on résumé detail. Ask me about his background and experience, or email him for a current CV."
  },

  {
    id: "hire", src: "profile/availability",
    k: ["hire", "hiring", "available", "availability", "open to", "opportunity", "opportunities", "work with", "collaborate", "recruit", "recruiter", "job offer", "looking for work", "freelance", "contract", "consulting"],
    a: "He's open to conversations about agentic AI, perception, and applied ML. The fastest way to reach him is email; the link is in the contact section at the bottom of the page."
  },

  {
    id: "contact", src: "profile/contact",
    k: ["contact", "email", "reach", "get in touch", "linkedin", "github", "connect", "message him", "mail him", "how to reach"],
    a: "You can reach him by email, or find him on GitHub, LinkedIn, and Google Scholar. All the links are in the contact section at the bottom of the page."
  },

  {
    id: "greeting", src: "agent/hello",
    k: ["hello", "hallo", "hey there", "good morning", "good evening", "good afternoon", "greetings", "howdy"],
    a: "Hi. Ask me anything about Anthony, his work, research, projects, or how to reach him. The suggestions below are a good place to start."
  },

  {
    id: "help", src: "agent/help",
    k: ["help", "what can i ask", "what can you do", "what can you tell", "options", "commands", "menu", "topics", "what do you know"],
    a: "You can ask about Anthony's background, his current work at Deutsche Börse, his Bosch and research years, his projects (Voyager, Heimdall AI, the read-it-later app, the talking action figure), his stack, and how to reach him. Type a question or tap a suggestion."
  },

  {
    id: "meta", src: "agent/self",
    k: ["are you real", "are you ai", "are you an ai", "are you a bot", "are you chatgpt", "are you claude", "real agent", "is this real", "is this a real", "how do you work", "what are you", "language model", "are you a model", "are you live", "scripted", "are you fake"],
    a: "Fair question. This is a small scripted agent running entirely in your browser, not a live language model. It matches your question to a set of answers written about Anthony. If you want the real thing, email him; the link is at the bottom."
  },

  {
    id: "thanks", src: "agent/thanks",
    k: ["thanks", "thank you", "danke", "cheers", "appreciate it", "much appreciated"],
    a: "Anytime. If you'd like to reach Anthony directly, the contact links are at the bottom of the page."
  },

  {
    id: "animation", src: "hero/embedding-space",
    k: ["animation", "what is this animation", "animated background", "background animation", "the dots", "what are the dots", "point cloud", "pointcloud", "behind his name", "behind the name", "embedding visual", "hero animation", "the visual", "what is that behind"],
    a: "Those drifting dots are an embedding space: text as vectors, where similar things sit close. Ask something and the agent's retrieve step lights up a query and its nearest neighbours. That's the core idea behind retrieval in his RAG work; real systems just add fast approximate-nearest-neighbour search and a reranking step on top."
  }
];

/** Reply when no KB entry matches the question. @type {string} */
const FALLBACK = "That's outside what this little agent knows. It can cover Anthony's background, his work at Deutsche Börse and Bosch, his research, his projects (Voyager, Heimdall AI, the read-it-later app, the talking action figure), his stack, and how to get in touch. For anything else, email is in the contact section.";
/** First message shown when the console loads. @type {string} */
const GREETING = "Ask anything about Anthony: his background, research, what he's building, or how to reach him. Try a suggestion below or type your own question.";

/**
 * Ultra-short / ambiguous inputs resolved by exact match, mapping the raw input
 * to a KB id (avoids e.g. "hi" fuzzy-matching "his"). @type {Object<string,string>}
 */
const EXACT = { hi: "greeting", hey: "greeting", yo: "greeting", sup: "greeting", hallo: "greeting", moin: "greeting", servus: "greeting", thx: "thanks", ty: "thanks", danke: "thanks" };

/** Starter suggestion buttons, as [label, query] pairs. @type {Array<[string,string]>} */
const CHIPS = [
  ["What's his background?", "what is his background"],
  ["What has he published?", "which papers has he published"],
  ["What is Voyager?", "what is voyager"],
  ["What's he into?", "what are his hobbies and interests"],
  ["Is this a real agent?", "are you a real agent"]
];

/** Maps an intent id to the page section its "retrieved context" link scrolls to. @type {Object<string,string>} */
const SECTION = {
  who: "about", whyhire: "about",
  experience: "experience", now: "experience", bosch: "experience", career: "experience", education: "experience", years: "experience", certifications: "experience",
  research: "publications", papers: "publications", patents: "publications", dissertation: "publications",
  voyager: "projects", readit: "projects", figure: "projects", heimdall: "projects", projects: "projects", stack: "projects",
  interests: "now", reading: "now",
  remote: "contact", location: "contact", hire: "contact", contact: "contact", cv: "contact"
};

/** Generic follow-up suggestions used when an intent has no specific NEXT entry. @type {Array<[string,string]>} */
const DEFAULT_NEXT = [["His background", "who is anthony"], ["What's he building?", "what projects is he building"], ["How to reach him?", "how to contact him"]];
/** Follow-ups shown when nothing matched, to steer the visitor back to real topics. @type {Array<[string,string]>} */
const BROWSE = [["His background", "who is anthony"], ["What's he building?", "what projects is he building"], ["What has he published?", "which papers has he published"], ["Is he open to work?", "is he open to work"]];
/** Context-aware follow-up suggestions keyed by intent id. @type {Object<string, Array<[string,string]>>} */
const NEXT = {
  who: [["His current role", "what does he do now"], ["His time at Bosch", "what did he do at bosch"], ["What's he building?", "what projects is he building"]],
  now: [["Why move to finance?", "why did he move to finance"], ["What is agentic AI?", "what is agentic ai"], ["His tech stack", "what is his tech stack"]],
  bosch: [["His research", "what is his research"], ["His dissertation", "what was his phd about"], ["Why leave automotive?", "why did he move to finance"]],
  research: [["Which papers?", "which papers has he published"], ["His dissertation", "what was his phd about"], ["Any patents?", "does he have patents"]],
  papers: [["His dissertation", "what was his phd about"], ["Any patents?", "does he have patents"], ["Research themes", "what is his research"]],
  patents: [["His papers", "which papers has he published"], ["His research", "what is his research"], ["His dissertation", "what was his phd about"]],
  dissertation: [["His papers", "which papers has he published"], ["His research", "what is his research"], ["Where did he study?", "where did he study"]],
  education: [["His dissertation", "what was his phd about"], ["His certifications", "what certifications does he have"], ["His research", "what is his research"]],
  certifications: [["His education", "where did he study"], ["His tech stack", "what is his tech stack"], ["His experience", "tell me about his experience"]],
  career: [["His current work", "what does he do now"], ["What is agentic AI?", "what is agentic ai"], ["His strengths", "why should we hire him"]],
  experience: [["His time at Bosch", "what did he do at bosch"], ["His current role", "what does he do now"], ["Where did he study?", "where did he study"]],
  voyager: [["Other projects", "what projects is he building"], ["His tech stack", "what is his tech stack"], ["What is RAG?", "what is rag"]],
  readit: [["Other projects", "what projects is he building"], ["What is RAG?", "what is rag"], ["His tech stack", "what is his tech stack"]],
  figure: [["Other projects", "what projects is he building"], ["His tech stack", "what is his tech stack"], ["His interests", "what are his hobbies"]],
  heimdall: [["Other projects", "what projects is he building"], ["What is RAG?", "what is rag"], ["His tech stack", "what is his tech stack"]],
  projects: [["What is Voyager?", "what is voyager"], ["The talking figure", "tell me about the talking action figure"], ["His tech stack", "what is his tech stack"]],
  stack: [["His projects", "what projects is he building"], ["Programming languages", "what programming languages does he use"], ["What is agentic AI?", "what is agentic ai"]],
  proglang: [["His full tech stack", "what is his tech stack"], ["His projects", "what projects is he building"], ["Spoken languages", "what languages does he speak"]],
  agentic: [["What is RAG?", "what is rag"], ["His current work", "what does he do now"], ["His tech stack", "what is his tech stack"]],
  rag: [["What is agentic AI?", "what is agentic ai"], ["What's this animation?", "what is this animation"], ["His current work", "what does he do now"]],
  whyhire: [["His experience", "who is anthony"], ["Is he open to work?", "is he open to work"], ["Contact him", "how to contact him"]],
  years: [["His background", "who is anthony"], ["His current role", "what does he do now"], ["His strengths", "why should we hire him"]],
  interests: [["What's he reading?", "what is he reading"], ["His side projects", "what projects is he building"], ["His background", "who is anthony"]],
  reading: [["His interests", "what are his hobbies"], ["His projects", "what projects is he building"], ["His background", "who is anthony"]],
  languages: [["Where is he based?", "where is he based"], ["Contact him", "how to contact him"], ["Is he open to work?", "is he open to work"]],
  remote: [["Where is he based?", "where is he based"], ["Is he open to work?", "is he open to work"], ["Contact him", "how to contact him"]],
  location: [["Open to relocation?", "is he open to remote or relocation"], ["Contact him", "how to contact him"], ["His current role", "what does he do now"]],
  hire: [["His strengths", "why should we hire him"], ["His background", "who is anthony"], ["Contact him", "how to contact him"]],
  contact: [["Is he open to work?", "is he open to work"], ["His background", "who is anthony"], ["His projects", "what projects is he building"]],
  cv: [["His background", "who is anthony"], ["His experience", "how many years of experience"], ["Contact him", "how to contact him"]],
  meta: [["How does RAG work?", "what is rag"], ["What's this animation?", "what is this animation"], ["Who is Anthony?", "who is anthony"]],
  animation: [["What is RAG?", "what is rag"], ["What is agentic AI?", "what is agentic ai"], ["His research", "what is his research"]],
  greeting: [["His background", "who is anthony"], ["What's he building?", "what projects is he building"], ["What has he published?", "which papers has he published"]],
  help: [["His background", "who is anthony"], ["What's he building?", "what projects is he building"], ["What has he published?", "which papers has he published"]]
};
