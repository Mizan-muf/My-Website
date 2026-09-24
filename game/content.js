/* ------------------------------------------------------------------------
   Portfolio content — single source of truth for the game.

   Merged from the classic page (classic.html) and the latest résumé
   (master_balanced). Where the two overlap, the résumé wins: it is newer.
   Everything here is plain data. Strings may contain a small amount of
   inline HTML (<strong>) — they are authored here, never user input.
   ------------------------------------------------------------------------ */

(function () {
  "use strict";

  var G = (window.G = window.G || {});

  var LINKEDIN = "https://www.linkedin.com/in/syed-mohammed-meezaan-chishty-19a4b0338";
  var GITHUB = "https://github.com/Mizan-muf";
  var EMAIL = "syedmeezan905@gmail.com";
  var RESUME = "resume/meezaan_chishty_resume.pdf";

  G.content = {
    profile: {
      name: "Meezaan Chishty",
      title: "AI/ML Engineer | Model Training & Applied AI",
      tagline: "AI/ML Engineer · Backend Developer · Product Builder",
      email: EMAIL,
      phone: "+91 7426917505",
      location: "Udaipur, Rajasthan, India",
      linkedin: LINKEDIN,
      github: GITHUB,
      site: "https://mizanchishty.ddns.net",
      resume: RESUME
    },

    /* The atrium slab. Interactable: opens the summary. */
    atrium: {
      kind: "about",
      title: "Meezaan Chishty",
      subtitle: "AI/ML Engineer | Model Training & Applied AI",
      body: [
        "AI/ML Engineer with hands-on experience building production systems, fine-tuning domain-specific LLMs, and deploying applied AI pipelines.",
        "Shipped enterprise platforms combining multi-agent RAG workflows, visual document extraction, and FastAPI microservices.",
        "Proven track record of cross-functional and asynchronous remote collaboration across international teams in the US, China, and India."
      ],
      facts: [
        { label: "Current role", value: "Full Stack AI/ML Engineer · FBSPL" },
        { label: "Based in", value: "Udaipur, India" },
        { label: "Focus", value: "Document AI · LLM systems · Backend APIs" }
      ],
      hint: "Walk right → to explore. Each glowing monolith holds a record."
    },

    /* Six gates, in walking order. Each item becomes one monolith. */
    sections: [
      {
        id: "projects",
        name: "Projects",
        kicker: "Selected Work",
        biome: "moss",
        items: [
          {
            kind: "project",
            title: "Hippo Cortex Retrieve",
            label: "HIPPO CORTEX",
            year: "2026",
            tag: "Open-source research",
            deck: "An open-source research architecture for long-term AI memory and context retrieval.",
            body: [
              "Retains and retrieves context across long-running AI agent conversations using a dual-retrieval pipeline.",
              "Combines <strong>Qdrant</strong> for semantic dense vector search, <strong>Kùzu Graph Database</strong> for entity-relation traversal, and an immutable Markdown file store for transparent auditability — integrated with local LLMs via Ollama."
            ],
            stack: ["Python", "Qdrant", "Kùzu Graph", "Ollama", "Docker", "RAG"],
            links: [{ text: "View Repository", href: "https://github.com/Mizan-muf/Hippo-Cortex-Retrive" }]
          },
          {
            kind: "project",
            title: "FBSPLAI — AI Insurance Sales Platform",
            label: "FBSPLAI",
            year: "2025",
            tag: "Proprietary · client live",
            deck: "A production AI insurance sales platform across 3 portals (client, admin/underwriter, AI chat) built as a Next.js 14 Turborepo monorepo with shared Radix UI components and Tailwind CSS.",
            body: [
              "Architected 10 FastAPI microservices — document extraction (LangChain/LangGraph), quote comparison and AI chat — integrating multi-provider LLMs (OpenAI, Google Gemini) and Cloud Vision OCR.",
              "Celery task queues, Redis caching and MongoDB on AWS EC2 behind an Nginx reverse proxy with JWT/RBAC security."
            ],
            metrics: [
              { value: "10", label: "microservices" },
              { value: "3", label: "portals" }
            ],
            stack: ["Next.js 14", "FastAPI", "Python", "MongoDB", "Celery", "LangGraph", "Docker"],
            links: [{ text: "fbsplai.com", href: "https://fbsplai.com" }]
          },
          {
            kind: "project",
            title: "Vocalytics-V0.3",
            label: "VOCALYTICS",
            year: "2023",
            tag: "Open-source analytics tool",
            deck: "An AI-driven sales analytics platform that converts voice commands into Plotly-based analytics workflows and natural-language summaries using OpenAI models.",
            body: [
              "Automatic CSV ingestion with encoding detection, AST-validated code execution, LightGBM forecasting, and Windows deployment via cx_Freeze."
            ],
            stack: ["Python", "Flask", "Pandas", "Plotly", "OpenAI API", "LightGBM"],
            links: [{ text: "View Project", href: "https://github.com/Mizan-muf/Vocalytics-V0.3" }]
          },
          {
            kind: "project",
            title: "Intelli-News-v1.1",
            label: "INTELLI-NEWS",
            year: "2024",
            deck: "A modular news intelligence pipeline for crawling, scraping, proxy management, and SQLite-based ingestion across regional news sources.",
            body: [
              "Robots-aware crawler/scraper components with retry logic, proxy pooling, browser fallback, and batch ingestion."
            ],
            stack: ["Python", "curl_cffi", "BeautifulSoup", "SQLite", "Playwright", "JSON"],
            links: [{ text: "View Project", href: "https://github.com/Mizan-muf/Newsletter-Intelli-version-1.1.0" }]
          },
          {
            kind: "project",
            title: "ACORD Forms Extraction",
            label: "ACORD",
            year: "2025",
            deck: "A layout-aware ACORD extraction pipeline using visual learning, computer vision, and OCR for text, tables, checkboxes, and document structure.",
            body: [
              "A self-learning flow through visual-model tuning and version switching for safer iteration and rollback."
            ],
            stack: ["Python", "Computer Vision", "OCR", "FastAPI", "PostgreSQL"]
          },
          {
            kind: "project",
            title: "Neo Wolf",
            label: "NEO WOLF",
            year: "2026",
            deck: "A custom 2.5D retro game engine with a native C++ core, SDL2-backed software rendering, and a C API boundary connecting to a C# interop layer for scriptable gameplay logic.",
            body: [
              "A complete software raycaster with texture-mapped walls, billboard sprite sorting, basic lighting, particle systems, and a fully file-driven asset pipeline for maps and entity configurations."
            ],
            stack: ["C++", "C#", "SDL2", "CMake", "Raycasting", "Software Rendering"],
            links: [{ text: "View Project", href: "https://github.com/Mizan-muf/Neo-Wolf-v1" }]
          },
          {
            kind: "project",
            title: "Distributed Network Monitoring Platform",
            label: "NET MONITOR",
            year: "2025",
            deck: "A two-tier server + agent platform for inventory, health metrics, and DPI alerts across <strong>700+ endpoints</strong>.",
            body: [
              "Sub-<strong>200ms</strong> WebSocket updates with dashboards and operational alerting."
            ],
            metrics: [
              { value: "700+", label: "endpoints" },
              { value: "<200ms", label: "live updates" }
            ],
            stack: ["Python", "Flask-Socket.IO", "MongoDB", "Redis", "Elasticsearch", "Docker"]
          }
        ]
      },

      {
        id: "experience",
        name: "Experience",
        kicker: "Career",
        biome: "amber",
        items: [
          {
            kind: "job",
            title: "Full Stack AI/ML Engineer",
            label: "FBSPL",
            company: "FBSPL",
            dates: "Feb 2025 — Present",
            place: "Udaipur, India",
            body: [
              "Leading development of a domain-adapted LLM for insurance policy underwriting and document intelligence — fine-tuning workflow, dataset preparation pipeline, and evaluation benchmarks, within strict proprietary data boundaries.",
              "Architected and shipped <strong>FBSPLAI</strong> — a production AI insurance sales platform with <strong>3 Next.js 14 portals</strong> and <strong>10 FastAPI microservices</strong>, orchestrating multi-agent RAG workflows for live client quote comparisons.",
              "Engineered an ACORD document extraction pipeline combining computer vision, visual document models, and OCR; automated extraction of tabular data, checkboxes, and form fields into structured databases.",
              "Delivered a distributed real-time operations monitoring platform across <strong>700+ endpoints</strong> with sub-<strong>200ms</strong> WebSocket broadcast updates.",
              "Introduced asynchronous task queues (Celery + Redis) and containerized microservices with Docker, improving background throughput and deployment reliability; reduced P95 latency by <strong>45%</strong>."
            ],
            metrics: [
              { value: "700+", label: "endpoints" },
              { value: "<200ms", label: "live updates" },
              { value: "−45%", label: "p95 latency" }
            ]
          },
          {
            kind: "job",
            title: "Python Developer",
            label: "NEOPANDA",
            company: "NeoPanda Tech",
            dates: "Mar 2024 — Feb 2025",
            place: "Shenzhen, China · Remote",
            body: [
              "Built and maintained production RESTful APIs and backend microservices in Python, integrating automated AI pipelines into daily content workflows.",
              "Built a RAG-based news intelligence system using vector embeddings and an autonomous AI agent; achieved a <strong>99.9% deduplication rate</strong> using MinHash and cosine similarity, cutting manual newsletter curation time by <strong>85%</strong> (from ~4 hours daily to under 35 minutes).",
              "Developed a crawler and scraper suite with proxy pooling, automated retry logic, and Playwright browser fallback, ingesting <strong>5,000+ daily articles</strong> from <strong>50+ regional sources</strong> into a SQLite pipeline."
            ],
            metrics: [
              { value: "99.9%", label: "dedup rate" },
              { value: "−85%", label: "curation time" },
              { value: "5,000+", label: "articles / day" }
            ]
          },
          {
            kind: "job",
            title: "AI/ML Engineering Intern",
            label: "IIT ROORKEE",
            company: "IIT Roorkee",
            dates: "Jan 2024 — Feb 2024",
            place: "Roorkee, India",
            body: [
              "Trained and evaluated supervised NLP classification models for sentiment analysis and emotion detection using Scikit-Learn and Pandas, achieving <strong>&gt;85% classification accuracy</strong> on validation sets.",
              "Built regression models for small-business sales forecasting, evaluated with RMSE to capture seasonal demand patterns.",
              "Benchmarked Small Language Models (SLMs) against larger LLMs on parameter efficiency and inference latency to guide model selection for resource-constrained edge deployments."
            ],
            metrics: [{ value: ">85%", label: "accuracy" }]
          },
          {
            kind: "job",
            title: "Lead Product Engineer",
            label: "ZUME",
            company: "Zume, Inc.",
            dates: "Apr 2023 — Mar 2024",
            place: "California, USA · Remote",
            body: [
              "Led AI application and ML feature development in an Agile/Scrum workflow, owning end-to-end delivery for <strong>3+ core product features</strong> with cross-functional US stakeholders.",
              "Engineered <strong>Vocalytics-V0.3</strong> — a voice-driven BI tool converting spoken natural-language queries into interactive Plotly visual workflows via speech recognition and OpenAI GPT-4, coupled with LightGBM sales forecasting.",
              "Implemented AST-based syntax validation to restrict executable operations before runtime evaluation in dynamic analytics workflows; packaged the desktop application using cx_Freeze."
            ]
          }
        ]
      },

      {
        id: "skills",
        name: "Skills",
        kicker: "Capabilities",
        biome: "azure",
        items: [
          {
            kind: "skills",
            title: "Model Training & Evaluation",
            label: "TRAINING",
            pills: ["PyTorch", "Hugging Face Transformers", "Supervised Fine-Tuning (SFT)", "Accuracy / F1 / RMSE", "Scikit-Learn", "LightGBM", "SLM Benchmarking"]
          },
          {
            kind: "skills",
            title: "Applied AI & LLM Systems",
            label: "APPLIED AI",
            pills: ["RAG", "LangChain", "LangGraph", "Multi-Agent Workflows", "Prompt Engineering", "Semantic Search", "Computer Vision", "OCR (Cloud Vision, Tesseract)", "OpenAI & Gemini APIs", "Ollama"]
          },
          {
            kind: "skills",
            title: "Software Engineering",
            label: "SOFTWARE",
            pills: ["Python", "TypeScript", "JavaScript", "SQL", "Go", "Bash", "FastAPI", "Next.js 14", "React.js", "Flask", "Node.js", "Express.js", "REST APIs", "WebSockets", "Celery", "Pydantic", "Turborepo", "Radix UI"]
          },
          {
            kind: "skills",
            title: "Data & Infrastructure",
            label: "DATA & INFRA",
            pills: ["Qdrant", "pgvector", "Weaviate", "Kùzu Graph", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Docker", "AWS (EC2, S3, ECS)", "Nginx", "Git", "Linux", "CI/CD"]
          }
        ]
      },

      {
        id: "certifications",
        name: "Certificates",
        kicker: "Continuous Learning",
        biome: "violet",
        items: [
          {
            kind: "certs",
            title: "AI / Machine Learning",
            label: "AI / ML",
            certs: [
              ["Hands-On AI: LLM Apps", "https://www.linkedin.com/learning/certificates/9fd3c7aac08df00e7bd910ba2ddf330de3ddd54b14f48c74923e55dc633d096a"],
              ["Intro to AI", "https://www.linkedin.com/learning/certificates/699efc9ed8fb2419bc9c506e3cb97cf91e540e8d88a3c0f7b9b9dbe8b59dc786"],
              ["Deep Learning with TensorFlow", "https://www.linkedin.com/learning/certificates/6b11ba7b0547ec739724ecda0df645128b7741fbfc9a2d458a8a850cf9be384f"],
              ["Model Optimization & Tuning", "https://www.linkedin.com/learning/certificates/71a636520507579ad303e5b71618ea025b971521e967830719874201ce2de906"],
              ["GCP for ML", "https://www.linkedin.com/learning/certificates/b79f4dde22949acc6dced9795615c8d63376648cf0cb27f03d97007fbadeb957"],
              ["R for Data Science", "https://www.linkedin.com/learning/certificates/2dd54d1e822f5411bd44cf1693401ff446ea4c2dffa195e85fafc7eb75fb5e7b"]
            ]
          },
          {
            kind: "certs",
            title: "Generative AI",
            label: "GEN AI",
            certs: [
              ["Career Essentials in GenAI", "https://www.linkedin.com/learning/certificates/062a1453c1af811329321b641d983520828618bf8d4fb77beb0d0f79912ceb1a"],
              ["What Is GenAI?", "https://www.linkedin.com/learning/certificates/207fe0df385e66e87ab1f810a442a463a92ef8701b7caa2a12009f0612ccd4f7"],
              ["GenAI: Evolution of Search", "https://www.linkedin.com/learning/certificates/d4c6d02497bb3aa0cd99ae76312da50ea11390796ca7455257982430e61358a5"],
              ["Ethics in GenAI", "https://www.linkedin.com/learning/certificates/ee072711312b59d98735eb368c9d759385e7790d543e6506d109a3bfbe07bbb4"]
            ]
          },
          {
            kind: "certs",
            title: "Backend & Web",
            label: "BACKEND",
            certs: [
              ["Django Essential Training", "https://www.linkedin.com/learning/certificates/7cbcd4d0c502bc42a5c3d0d964295ecc5578787d12bb9cabec34adad3184a6f0"],
              /* Same URL as "GenAI: Evolution of Search" on the classic page —
                 likely a copy-paste slip. Kept verbatim until corrected. */
              ["Node.js Essential Training", "https://www.linkedin.com/learning/certificates/d4c6d02497bb3aa0cd99ae76312da50ea11390796ca7455257982430e61358a5"],
              ["Intro to HTML", "https://coursera.org/verify/KVKSX7TK74VA"],
              ["Intro to CSS", "https://coursera.org/verify/FDFLFYXPHMVJ"],
              ["TCP/IP & Advanced Topics", "https://www.coursera.org/account/accomplishments/records/YV9HQFZJ888P"]
            ]
          },
          {
            kind: "certs",
            title: "OOP & Java",
            label: "JAVA",
            certs: [
              ["Core Java Specialization", "https://www.coursera.org/account/accomplishments/specialization/W45B4GT9JDVN"],
              ["Intro to Java", "https://www.coursera.org/account/accomplishments/records/TH96V3VSDRMY"],
              ["Intro to OOP with Java", "https://www.coursera.org/account/accomplishments/records/GJJZMWARA48V"],
              ["OOP Hierarchies in Java", "https://www.coursera.org/account/accomplishments/records/MCJ6NDFM9R2Z"],
              ["Java Class Library", "https://www.coursera.org/account/accomplishments/records/XM65WYFHTWCV"],
              ["Fundamentals of Data Warehousing", "https://www.coursera.org/account/accomplishments/records/RNJL26YLE6PE"]
            ]
          },
          {
            kind: "certs",
            title: "Game Dev & C#",
            label: "GAME DEV",
            certs: [
              ["C# for Unity (Specialization)", "https://coursera.org/verify/specialization/BW5XKXSTZPNE"],
              ["Intro to C# and Unity", "https://coursera.org/verify/FZMJBXQJ4MMB"],
              ["More C# and Unity", "https://coursera.org/verify/9DCFWKXMJWX8"],
              ["C# Class Development", "https://coursera.org/verify/LZKX3K8HV4MG"],
              ["Intermediate OOP for Unity", "https://coursera.org/verify/CWUJQVQ2F3Y3"],
              ["Intro to Scratch", "https://coursera.org/verify/DTC8X3TW8V3K"],
              ["Intro to Game Design", "https://www.coursera.org/account/accomplishments/records/TRJK53CRP2P4"]
            ]
          },
          {
            kind: "certs",
            title: "Productivity & Tools",
            label: "TOOLS",
            certs: [
              ["Microsoft Copilot", "https://www.linkedin.com/learning/certificates/4e2bb0ad9a4bbaa4aacd3ef330606cbe0a0288fe2810625598d7053fad117e71"],
              ["M365 Copilot for Work", "https://www.linkedin.com/learning/certificates/31b303a1c3ff10ca975b902b514e43cc609c64911e21d0f617fa1f26893015db"]
            ]
          }
        ]
      },

      {
        id: "education",
        name: "Education",
        kicker: "Academic Background",
        biome: "rose",
        items: [
          {
            kind: "edu",
            title: "Jamia Hamdard University",
            label: "JAMIA HAMDARD",
            degree: "Master of Computer Applications (MCA) in Computer Science",
            dates: "Jan 2025 — Present",
            score: "GPA 8.95 / 10"
          },
          {
            kind: "edu",
            title: "Manipal University Jaipur",
            label: "MANIPAL",
            degree: "Bachelor of Computer Applications (BCA)",
            dates: "Oct 2021 — Apr 2024",
            score: "GPA 8.88 / 10 (≈ 3.55 / 4.00)",
            note: "Dean's List Awardee — highest GPA in cohort"
          }
        ]
      },

      {
        id: "contact",
        name: "Contact",
        kicker: "The Shrine",
        biome: "gold",
        items: [
          {
            kind: "contact",
            shrine: true,
            title: "Let’s build something useful.",
            label: "CONTACT",
            body: [
              "Open to AI/ML engineering, applied AI, backend development, and product engineering opportunities."
            ],
            links: [
              { text: EMAIL, href: "mailto:" + EMAIL, icon: "mail" },
              { text: "+91 7426917505", href: "tel:+917426917505", icon: "phone" },
              { text: "LinkedIn", href: LINKEDIN, icon: "link" },
              { text: "GitHub", href: GITHUB, icon: "link" },
              { text: "mizanchishty.ddns.net", href: "https://mizanchishty.ddns.net", icon: "link" },
              { text: "Résumé (PDF)", href: RESUME, icon: "file" }
            ]
          }
        ]
      }
    ]
  };
})();
