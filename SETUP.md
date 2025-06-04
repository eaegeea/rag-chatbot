# Setup Guide for RAG Sales Chatbot

This guide will walk you through setting up the RAG Sales Chatbot with fine-grained authorization.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Docker Desktop** installed ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** installed ([Download](https://git-scm.com/))

## API Keys Required

You'll need the following API keys:

### 1. OpenAI API Key (Required)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### 2. Oso Cloud API Key (Optional but Recommended)
1. Go to [Oso Cloud Console](https://cloud.osohq.com)
2. Sign up for an account
3. Create a new project
4. Go to Settings → API Keys
5. Create a new API key

## Step-by-Step Setup

### Step 1: Clone and Install

```bash
# Clone this repository (or use your preferred method)
git clone <repository-url>
cd rag-sales-chatbot

# Install dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy the environment template
cp env.example .env

# Edit the .env file with your API keys
nano .env  # or use your preferred editor
```

Fill in your `.env` file:
```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Supabase Configuration (Auto-filled by supabase start)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Oso Cloud Configuration (Optional)
OSO_CLOUD_API_KEY=your-oso-cloud-api-key-here
OSO_CLOUD_URL=https://cloud.osohq.com

# Database Configuration (Auto-configured)
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres?schema=public"

# Debug Configuration (Optional)
DEBUG=main
```

### Step 3: Start Supabase

```bash
# Initialize Supabase (first time only)
npx supabase init

# Start Supabase services
npx supabase start
```

This will:
- Start PostgreSQL with vector extensions
- Start the Supabase API
- Show you the local URLs and keys

**Important**: Copy the `anon key` and `service_role key` from the output into your `.env` file.

### Step 4: Initialize the Database

```bash
# Reset and seed the database
npx supabase db reset

# Generate Prisma client
npm run db:generate
```

### Step 5: Initialize the Application

```bash
# Run the initialization script
npm run initialize
```

This will:
- Test all connections (OpenAI, Database, Oso Cloud)
- Generate vector embeddings for all customer notes
- Initialize authorization data

### Step 6: Configure Oso Cloud (Optional)

If you're using Oso Cloud, you need to configure your authorization policy:

1. Go to [Oso Cloud Console](https://cloud.osohq.com)
2. Create a new project or select your existing one
3. Go to the Policy Editor
4. Copy the policy from `policies/sales.polar` into the editor
5. Load the facts (users, regions, customers) through the Data tab

**Note**: If you don't configure Oso Cloud, the app will use simplified authorization logic.

## Running the Application

### Start the Chatbot

```bash
# Start the interactive chatbot
npm start

# Or explicitly run the chat command
npm start chat

# List all available users
npm start list-users
```

### Using the Chatbot

1. **Select a User**: Choose from the available users (see below)
2. **Ask Questions**: Try questions about customer concerns, pricing, feedback, etc.
3. **Exit**: Type "exit" to quit

### Sample Users

The application comes with these pre-configured users:

#### East Region
- **alice@company.com** (Alice Johnson) - Salesperson
  - Can see notes for customers: John Peterson, Sarah Wilson, Mike Thompson
- **bob@company.com** (Bob Smith) - Salesperson  
  - Can see notes for customers: Lisa Garcia, Tom Anderson, Anna Rodriguez
- **carol@company.com** (Carol Williams) - Sales Manager
  - Can see all customer notes in East region

#### West Region
- **david@company.com** (David Brown) - Salesperson
  - Can see notes for customers: Chris Lee, Rachel Kim, Mark Taylor
- **eve@company.com** (Eve Davis) - Salesperson
  - Can see notes for customers: Jessica White, Ryan Martinez, Amy Chen
- **frank@company.com** (Frank Miller) - Sales Manager
  - Can see all customer notes in West region

## Example Questions to Try

- "What are the main customer concerns?"
- "Show me information about pricing discussions"
- "What feedback have we received about our product?"
- "Are there any integration issues mentioned?"
- "Tell me about customer satisfaction levels"
- "What are customers saying about our competitors?"

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Make sure Supabase is running
npx supabase status

# If not running, start it
npx supabase start
```

#### 2. OpenAI API Errors
- Check that your API key is correct in `.env`
- Verify you have sufficient credits in your OpenAI account
- Check the OpenAI status page for service issues

#### 3. No Embeddings Generated
```bash
# Regenerate embeddings
npm run initialize
```

#### 4. Oso Cloud Connection Issues
- Verify your API key is correct
- Check the Oso Cloud status page
- The app will work with simplified authorization if Oso Cloud is unavailable

### Reset Everything

If you need to start fresh:

```bash
# Stop Supabase
npx supabase stop

# Remove Supabase data
rm -rf .supabase

# Start fresh
npx supabase start
npm run initialize
```

### Debug Mode

Enable debug logging to see more details:

```bash
# Set debug flag in .env
DEBUG=main,database,ai,auth,embeddings

# Or run with debug
DEBUG=* npm start
```

## Development

### Database Changes

If you modify the database schema:

```bash
# Generate a new migration
npx supabase db diff -f your_migration_name

# Apply the migration
npx supabase db reset

# Regenerate Prisma client
npm run db:generate
```

### Adding New Sample Data

Edit `supabase/seed.sql` and run:

```bash
npx supabase db reset
npm run initialize
```

### Monitoring

- **Database**: Access Supabase Studio at http://127.0.0.1:54323
- **Logs**: Enable debug mode to see detailed logs
- **Vector Search**: Use debug mode to see similarity scores

## Production Deployment

For production deployment, you'll need to:

1. Set up a production Supabase project
2. Configure your Oso Cloud production environment
3. Update environment variables for production
4. Set up proper logging and monitoring

Refer to the respective documentation for:
- [Supabase Production Deployment](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Oso Cloud Production Setup](https://docs.osohq.com/getting-started)

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review the logs with debug mode enabled
3. Check the GitHub issues for known problems
4. Refer to the documentation for individual services:
   - [OpenAI API Documentation](https://platform.openai.com/docs)
   - [Supabase Documentation](https://supabase.com/docs)
   - [Oso Cloud Documentation](https://docs.osohq.com)

## Next Steps

Once you have the basic setup working:

1. Customize the authorization policy in Oso Cloud
2. Add more sample data
3. Experiment with different embedding models
4. Enhance the chatbot prompts
5. Add more sophisticated chunking strategies 