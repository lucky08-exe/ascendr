"""Structured Learning Paths data for Ascendr."""

PATHS_DATA = [
    {
        "slug": "backend-foundations",
        "title": "Backend Development Foundations",
        "tagline": "Learn how web applications move data, validate requests, and stay resilient behind the user interface.",
        "level": "Some Experience / Intermediate",
        "duration": "8 weeks (4–5 hrs/week)",
        "outcome": "Design, build, and deploy production-grade REST APIs connected to persistent databases.",
        "certification": "Cloud Developer Fundamentals",
        "stages": [
            {
                "num": 1,
                "title": "Understand Requests & Protocols",
                "desc": "Master HTTP methods, status codes, route design, request validation, and middleware pipelines.",
                "search": "python",
                "skills": ["HTTP/HTTPS", "REST APIs", "Request Validation", "Routing"]
            },
            {
                "num": 2,
                "title": "Work with Persistent Data Stores",
                "desc": "Relational schemas, SQL querying, indexing, and connection pooling for scalable read/write traffic.",
                "search": "database",
                "skills": ["SQL", "Relational Databases", "Data Normalization", "Query Optimization"]
            },
            {
                "num": 3,
                "title": "Ship & Secure a Backend Service",
                "desc": "Implement authentication, containerize services, and deploy dependable backends to cloud runtimes.",
                "search": "containers",
                "skills": ["Containerization", "Cloud Run", "API Security", "CI/CD Deployment"]
            }
        ]
    },
    {
        "slug": "first-steps-ai-ml",
        "title": "First Steps into AI & Machine Learning",
        "tagline": "Build a plain-language mental model of modern AI, then put concepts to work with hands-on models and prompt patterns.",
        "level": "New to Tech / Introductory",
        "duration": "6–8 weeks (4 hrs/week)",
        "outcome": "A clear conceptual foundation of AI/ML, practical prompt engineering skills, and applied inference.",
        "certification": "Google Cloud Introduction to Generative AI",
        "stages": [
            {
                "num": 1,
                "title": "Get Oriented with Core ML Concepts",
                "desc": "Learn the essentials: datasets, features, supervised learning, neural networks, and model evaluation.",
                "search": "machine learning",
                "skills": ["Data Preprocessing", "Model Training", "Loss Functions", "Evaluation Metrics"]
            },
            {
                "num": 2,
                "title": "Generative AI & Prompt Engineering",
                "desc": "Understand transformer architecture, embeddings, semantic search, and prompting strategies.",
                "search": "generative ai",
                "skills": ["Large Language Models", "Prompt Engineering", "Vector Embeddings", "Multimodal AI"]
            },
            {
                "num": 3,
                "title": "Applied AI Inference & Safety",
                "desc": "Call foundational model APIs, handle structured outputs, and apply responsible AI safety rails.",
                "search": "vertex ai",
                "skills": ["Gemini API", "Model Fine-Tuning", "Responsible AI", "API Integration"]
            }
        ]
    },
    {
        "slug": "data-analytics",
        "title": "Data Analytics & SQL Pipelines",
        "tagline": "Ask better questions of your data, optimize analytical SQL queries, and construct automated reporting dashboards.",
        "level": "Introductory to Intermediate",
        "duration": "6–8 weeks (4 hrs/week)",
        "outcome": "Analyze enterprise datasets using high-performance cloud SQL and present clear visual intelligence.",
        "certification": "Data Analyst Certification Alignment",
        "stages": [
            {
                "num": 1,
                "title": "Advanced SQL & Query Mastery",
                "desc": "Filter large datasets, write analytical window functions, join disparate tables, and aggregate metrics.",
                "search": "sql",
                "skills": ["Complex SQL", "Aggregations", "Window Functions", "Table Joins"]
            },
            {
                "num": 2,
                "title": "Cloud Data Warehouses & BigQuery",
                "desc": "Query multi-gigabyte public datasets, partition tables for speed, and manage analytics costs.",
                "search": "analytics",
                "skills": ["BigQuery", "Data Warehousing", "Partitioning", "Schema Design"]
            },
            {
                "num": 3,
                "title": "Visual Storytelling & Business Dashboards",
                "desc": "Turn raw data rows into interactive dashboards, KPI monitors, and decision-making reports.",
                "search": "reporting",
                "skills": ["Looker Studio", "Dashboard Design", "Data Visualization", "Executive Reporting"]
            }
        ]
    },
    {
        "slug": "cloud-computing",
        "title": "Cloud Computing & Architecture",
        "tagline": "Understand the building blocks behind modern distributed applications: compute, storage, networks, and automated deployment.",
        "level": "Introductory to Intermediate",
        "duration": "8–10 weeks (4–5 hrs/week)",
        "outcome": "Deploy, configure, and secure scalable multi-tier cloud infrastructure with hands-on console experience.",
        "certification": "Google Cloud Certified Associate Cloud Engineer",
        "stages": [
            {
                "num": 1,
                "title": "Map the Infrastructure Blocks",
                "desc": "Get hands-on with Cloud Storage, Virtual Machines, VPC networks, and IAM identity perimeters.",
                "search": "fundamentals",
                "skills": ["Compute Engine", "Cloud Storage", "VPC Networking", "Cloud IAM"]
            },
            {
                "num": 2,
                "title": "Containers & Microservices Orchestration",
                "desc": "Package applications with Docker, launch Kubernetes clusters, and manage pods with GKE.",
                "search": "kubernetes",
                "skills": ["Docker", "Kubernetes", "GKE", "Microservices"]
            },
            {
                "num": 3,
                "title": "Systems Thinking & Architecture Observability",
                "desc": "Configure load balancers, implement Cloud Monitoring metrics, and audit cloud security posture.",
                "search": "security",
                "skills": ["Cloud Monitoring", "Cloud Logging", "Cloud Architecture", "Disaster Recovery"]
            }
        ]
    }
]

ALIASES = {
    "backend-development": "backend-foundations",
    "backend": "backend-foundations",
    "artificial-intelligence": "first-steps-ai-ml",
    "ai": "first-steps-ai-ml",
    "cloud": "cloud-computing",
    "data": "data-analytics",
}

def get_paths():
    return PATHS_DATA

def get_path_by_slug(slug: str):
    target = ALIASES.get(slug, slug)
    for p in PATHS_DATA:
        if p["slug"] == target:
            return p
    return None
