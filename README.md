# Energia Legal AI - Python Backend

## 🏛️ Project Overview

**Energia Legal AI** is a sophisticated legal intelligence platform built in Python that combines artificial intelligence, real-time monitoring, and expert legal knowledge to provide comprehensive contract analysis, legal research, and compliance monitoring services. Built specifically for the Hungarian legal market with energy sector specialization.

### 🎯 Core Mission
Transform legal document analysis and compliance monitoring through intelligent AI agents, proactive legal change detection, and personalized recommendations for legal professionals.

### 🏗️ Architecture Highlights
- **Python-First Design**: FastAPI-based microservices architecture
- **Multi-Agent AI System**: Mixture of Experts router with specialized legal agents
- **Real-time Legal Monitoring**: Supabase-powered change detection and notifications  
- **Role-Based Access Control**: Secure multi-tenant architecture for different user types
- **Hungarian Localization**: Native language support for Hungarian legal professionals
- **Energy Sector Focus**: Specialized domain knowledge for energy industry contracts

### 🚀 Key Features
- **Intelligent Contract Analysis**: AI-powered risk assessment and clause extraction
- **Legal Document Crawling**: Automated collection from Hungarian legal sources
- **Proactive Legal Alerts**: Real-time monitoring of legal changes affecting contracts
- **Multi-Language Support**: Document processing in Hungarian and English
- **Semantic Search**: Vector-based document similarity and retrieval
- **Performance Analytics**: Comprehensive telemetry and user feedback systems
- **Scalable Architecture**: Python-based backend with microservices design

---

## 🛠️ Tech Stack

### **Backend (Python)**
- **Framework**: FastAPI (planned)
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: OpenAI, Anthropic Claude, Google Gemini
- **Web Scraping**: Playwright-based crawlers
- **Authentication**: Supabase Auth

### **Current Implementation**
- **Language**: Python 3.11+
- **Dependencies**: Supabase Python SDK, python-dotenv
- **Database**: Supabase PostgreSQL with RLS
- **Deployment**: Supabase Edge Functions

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11 or higher
- Supabase account and project
- AI API keys (OpenAI, Anthropic, etc.)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/markbunyevacz/energia-ai-python.git
   cd energia-ai-python
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp env.template .env
   # Edit .env with your actual API keys and configuration
   ```

4. **Configure Supabase:**
   - Create a new Supabase project
   - Copy your project URL and keys to `.env`
   - Run database migrations:
   ```bash
   supabase db push
   ```

5. **Test the setup:**
   ```bash
   python main.py
   ```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key

# Application Configuration
ENVIRONMENT=development
DEBUG=True
API_PORT=8000
API_HOST=localhost
```

---

## 🔧 Development

### Running the Application

```bash
# Start the main application
python main.py

# Test configuration
python config.py
```

### Key Systems

- **Authentication & Authorization**: Role-based access control (RBAC) system built on Supabase with profiles and user_roles tables
- **Legal Document Crawling**: Automated collection from Hungarian legal sources (Jogtár, Magyar Közlöny)
- **AI-Powered Analysis**: Multi-provider AI integration with OpenAI, Anthropic, and Google models
- **Database Schema**: Comprehensive legal document storage with vector embeddings

### Development Workflow

1. **Make changes** to Python code
2. **Test locally** with `python main.py`
3. **Run tests** (when available)
4. **Deploy** to Supabase Edge Functions

---

## 📚 Documentation

- **Setup Guide**: See [SETUP.md](SETUP.md) for detailed setup instructions
- **Architecture**: See [docs/Python_Architektura_Specifikacio_Backlog.md](docs/Python_Architektura_Specifikacio_Backlog.md)
- **Development Principles**: See [docs/dp.md](docs/dp.md)

---

## 🔐 Security

- **Environment Variables**: Never commit `.env` files
- **API Keys**: Use environment variables for all sensitive data
- **Database Security**: Row Level Security (RLS) enabled on all tables
- **Authentication**: Supabase Auth with role-based permissions

---

## 🚧 Current Status

This project is currently in **early development phase**:

- ✅ **Basic Python structure** with Supabase integration
- ✅ **Configuration management** with environment variables
- ✅ **Database connection** and health checks
- 🔄 **Legal document crawlers** (in development)
- 🔄 **AI integration** (planned)
- 🔄 **API endpoints** (planned)

---

## 🗺️ Roadmap

### Phase 1: Foundation (Current)
- [x] Python project structure
- [x] Supabase integration
- [x] Basic configuration
- [ ] Legal document crawlers
- [ ] Database schema setup

### Phase 2: Core Features
- [ ] FastAPI application framework
- [ ] AI model integration
- [ ] Document processing pipeline
- [ ] Basic API endpoints

### Phase 3: Advanced Features
- [ ] Multi-agent AI system
- [ ] Real-time monitoring
- [ ] Advanced search capabilities
- [ ] Performance analytics

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the backend infrastructure
- [OpenAI](https://openai.com/) for AI capabilities
- [Anthropic](https://anthropic.com/) for Claude AI
- Hungarian legal community for domain expertise 