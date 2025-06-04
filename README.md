# RAG Sales Chatbot with Fine-Grained Authorization

A sample RAG (Retrieval-Augmented Generation) chatbot that demonstrates fine-grained authorization for sales teams using OpenAI, Supabase, and Oso Cloud.

## Overview

This chatbot implements a realistic sales scenario where:
- **2 Regions**: East & West
- **Each region has**:
  - 2 Salespeople
  - 1 Sales Manager
- **Authorization Rules**:
  - Salespeople can only see notes about their own customers
  - Sales Managers can see all customer notes in their own region

## Architecture

- **OpenAI**: LLM responses and text embeddings
- **Supabase**: PostgreSQL with vector extensions for embeddings storage
- **Oso Cloud**: Fine-grained authorization service
- **Prisma**: Database ORM

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for Supabase local development)
- OpenAI API key
- Oso Cloud account

### Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Start Supabase locally**:
   ```bash
   npx supabase start
   ```

4. **Initialize the database and populate data**:
   ```bash
   npm run initialize
   ```

5. **Start the chatbot**:
   ```bash
   npm start
   ```

### Required API Keys

1. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Oso Cloud API Key**: Get from [Oso Cloud Console](https://cloud.osohq.com)
3. **Supabase Keys**: Generated automatically when running `supabase start`

## Sample Users

The app comes with these sample users:

### East Region
- **alice@company.com** (Salesperson) - Can see notes for customers 1-3
- **bob@company.com** (Salesperson) - Can see notes for customers 4-6  
- **carol@company.com** (Sales Manager) - Can see all East region notes

### West Region
- **david@company.com** (Salesperson) - Can see notes for customers 7-9
- **eve@company.com** (Salesperson) - Can see notes for customers 10-12
- **frank@company.com** (Sales Manager) - Can see all West region notes

## Usage Examples

```bash
# Start the chatbot
npm start

# When prompted, enter a user email (e.g., alice@company.com)
# Then ask questions like:
# - "What are the recent notes about customer concerns?"
# - "Show me information about pricing discussions"
# - "What feedback have we received from customers?"
```

## Project Structure

```
├── src/
│   ├── cli.js              # Command-line interface
│   ├── initialize.js       # Database and authorization setup
│   ├── lib/
│   │   ├── ai.js          # OpenAI integration
│   │   ├── auth.js        # Oso Cloud authorization
│   │   ├── database.js    # Database operations
│   │   └── embeddings.js  # Vector embedding operations
│   └── config/
│       └── schema.prisma  # Database schema
├── supabase/
│   ├── migrations/        # Database migrations
│   └── seed.sql          # Sample data
└── policies/
    └── sales.polar       # Oso authorization policies
```

## Development

```bash
# Reset database
npm run db:reset

# Run in development mode (with file watching)
npm run dev

# Generate database client
npm run db:generate
```

## Authorization Model

The authorization is handled by Oso Cloud with the following entity relationships:

- **Users** belong to **Regions** and have **Roles** (salesperson or sales_manager)
- **Customers** belong to **Regions** and are assigned to **Salespeople**
- **CustomerNotes** belong to **Customers**

Authorization rules:
- Salespeople can read customer notes only for their assigned customers
- Sales managers can read all customer notes in their region

## License

MIT License - see LICENSE file for details.

## Reference

Based on the [Oso Cloud RAG Chatbot Guide](https://www.osohq.com/post/building-an-authorized-rag-chatbot-with-oso-cloud). 