# Energia Legal AI Demo - Advanced Legal Intelligence Platform

## 🏛️ Project Overview

**Energia Legal AI Demo** is a sophisticated legal intelligence platform that combines artificial intelligence, real-time monitoring, and expert legal knowledge to provide comprehensive contract analysis, legal research, and compliance monitoring services. Built specifically for the Hungarian legal market with energy sector specialization.

### 🎯 Core Mission
Transform legal document analysis and compliance monitoring through intelligent AI agents, proactive legal change detection, and personalized recommendations for legal professionals.

### 🏗️ Architecture Highlights
- **Multi-Agent AI System**: Mixture of Experts router with specialized legal agents
- **Real-time Legal Monitoring**: Supabase-powered change detection and notifications  
- **Role-Based Access Control**: Secure multi-tenant architecture for different user types
- **Hungarian Localization**: Native language support for Hungarian legal professionals
- **Energy Sector Focus**: Specialized domain knowledge for energy industry contracts

### 🚀 Key Features
- **Intelligent Contract Analysis**: AI-powered risk assessment and clause extraction
- **Proactive Legal Alerts**: Real-time monitoring of legal changes affecting contracts
- **Multi-Language Support**: Document processing in Hungarian and English
- **Semantic Search**: Vector-based document similarity and retrieval
- **Performance Analytics**: Comprehensive telemetry and user feedback systems
- **Scalable Architecture**: Serverless backend with edge function deployment

---

# Energia Jogi AI

A modern web application for legal document analysis and contract management, built with React, TypeScript, and AI capabilities.

## Tech Stack

- ⚡️ [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- ⚛️ [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- 📘 [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- 🎨 [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- 🎯 [shadcn/ui](https://ui.shadcn.com/) - Re-usable components built with Radix UI and Tailwind CSS

## Features

- 🤖 AI-powered document analysis
- 📄 Contract processing and management
- 🔍 Advanced search capabilities
- 📊 Data visualization and analytics
- 🔐 Secure document handling
- 📱 Responsive design

### Key Systems

-   **Authentication & Authorization**: A robust, role-based access control (RBAC) system built on Supabase. It includes a custom `profiles` table and a `user_roles` table, with a clear hierarchy (`admin` > `legal_manager` > `analyst` > `viewer`). Row Level Security (RLS) is enforced, and a secure `get_my_role()` function prevents common authorization pitfalls.
-   **AI-Powered Analysis**: The core of the application, featuring an `AIAgentRouter` that intelligently routes user queries to the most appropriate AI agent based on context and keywords.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/markbunyevacz/energiajogi-ai-gondolat.git
   cd energiajogi-ai-gondolat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables and Supabase environment variables:
   ```env
   VITE_API_URL=your_api_url
   VITE_API_KEY=your_api_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Apply the database migrations:
   This project uses Supabase for database management. To set up your local database schema, you will need to have the Supabase CLI installed and run the migrations located in the `supabase/migrations` directory.

   ```bash
   # (Assuming Supabase CLI is installed and you are logged in)
   supabase db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler check

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vite](https://vitejs.dev/) for the blazing fast development experience 