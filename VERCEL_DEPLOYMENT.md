# Vercel Deployment Guide

This guide walks you through deploying the RAG Sales Chatbot to Vercel with full Oso Cloud authorization.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/rag-sales-chatbot)

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Production Database**: Set up a production PostgreSQL database with vector extension
3. **API Keys**:
   - OpenAI API Key
   - Oso Cloud API Key
   - Database connection string

## Step 1: Prepare Your Database

### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to **Settings** → **Database** and copy your connection string
4. Enable the vector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Option B: Other PostgreSQL Providers

- **Neon**: [neon.tech](https://neon.tech)
- **Railway**: [railway.app](https://railway.app)
- **PlanetScale**: [planetscale.com](https://planetscale.com) (requires vector support)

## Step 2: Configure Oso Cloud

### 1. Create Oso Cloud Project

1. Go to [cloud.osohq.com](https://cloud.osohq.com)
2. Create a new project
3. Go to **Settings** → **API Keys** and create a new key

### 2. Configure Policy

In the Oso Cloud **Policy Editor**, add this policy:

```polar
# Main authorization rule for reading customer notes
allow(actor: User, "read", resource: CustomerNote) if
    can_read_customer_note(actor, resource);

# Salespeople can read customer notes for their assigned customers
can_read_customer_note(user: User, note: CustomerNote) if
    user.role = "salesperson" and
    note.customer.salesperson = user;

# Sales managers can read all customer notes in their region
can_read_customer_note(user: User, note: CustomerNote) if
    user.role = "sales_manager" and
    note.customer.region = user.region;

# Rules for blocks (vector embeddings)
allow(actor: User, "read", resource: Block) if
    allow(actor, "read", resource.customer_note);
```

### 3. Load Facts (Data)

You'll load the facts automatically during deployment, but here's what gets loaded:

- **Users**: `alice@company.com`, `bob@company.com`, `carol@company.com`, etc.
- **Regions**: `East`, `West`
- **Customers**: Assigned to salespeople and regions
- **Customer Notes**: Linked to customers
- **Blocks**: Vector embeddings linked to notes

## Step 3: Deploy to Vercel

### Method 1: Connect GitHub Repository

1. Push your code to GitHub
2. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
3. Click **"New Project"**
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Deploy

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set production environment variables
vercel env add OPENAI_API_KEY
vercel env add OSO_CLOUD_API_KEY
vercel env add DATABASE_URL

# Redeploy with environment variables
vercel --prod
```

## Step 4: Environment Variables

In your Vercel project settings, add these environment variables:

```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Database Configuration (Required)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Oso Cloud Configuration (Required for full authorization)
OSO_CLOUD_API_KEY=your-oso-cloud-api-key-here
OSO_CLOUD_URL=https://cloud.osohq.com

# Node Environment
NODE_ENV=production
```

## Step 5: Initialize Production Database

### Option 1: Local Migration

```bash
# Set production database URL locally
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma db push

# Seed the database
npx prisma db seed

# Generate embeddings and load Oso facts
npm run initialize
```

### Option 2: Custom Build Script

The deployment will automatically run the build script that:

1. Generates Prisma client
2. Runs database migrations
3. Seeds sample data
4. Generates embeddings
5. Loads facts into Oso Cloud

## Step 6: Test Deployment

1. Visit your Vercel URL
2. Select a user (e.g., `alice@company.com`)
3. Ask a question: *"What are the main customer concerns?"*
4. Verify the response is relevant and authorized

## Step 7: Custom Domain (Optional)

1. Go to your Vercel project **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed

## Architecture on Vercel

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes     │    │   External      │
│   (Static)      │───▶│   /api/chat      │───▶│   Services      │
│                 │    │                  │    │                 │
│ • User Selection│    │ • Authentication │    │ • OpenAI API    │
│ • Chat Interface│    │ • Vector Search  │    │ • Oso Cloud     │
│ • Real-time UI  │    │ • Authorization  │    │ • PostgreSQL    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Performance Considerations

### Database Connection Pooling

For production, consider using connection pooling:

```bash
# Example with Supabase pooling
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true&connection_limit=1"
```

### Caching

Consider adding Redis caching for:
- Frequent authorization checks
- Vector similarity results
- User session data

### Rate Limiting

Implement rate limiting for the chat API:

```javascript
// api/chat.js
import rateLimit from '@vercel/edge-rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per minute
});

export default async function handler(req, res) {
  try {
    await limiter.check(res, 10, 'CACHE_TOKEN'); // 10 requests per minute per user
    // ... rest of your handler
  } catch {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
}
```

## Monitoring & Debugging

### 1. Vercel Analytics

Enable Vercel Analytics for performance monitoring:

```javascript
// Add to your HTML head
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
```

### 2. Logging

Add structured logging:

```javascript
// api/chat.js
console.log('Chat request:', {
  user: req.body.user,
  messageLength: req.body.message?.length,
  timestamp: new Date().toISOString()
});
```

### 3. Error Tracking

Consider integrating with:
- [Sentry](https://sentry.io)
- [LogRocket](https://logrocket.com)
- [DataDog](https://datadoghq.com)

## Security Best Practices

### 1. Environment Variables

- Never commit API keys to Git
- Use Vercel's secure environment variable storage
- Rotate keys regularly

### 2. CORS Configuration

The API is configured with CORS headers. For production, restrict origins:

```javascript
// api/chat.js
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
```

### 3. Input Validation

Add request validation:

```javascript
import Joi from 'joi';

const schema = Joi.object({
  user: Joi.string().email().required(),
  message: Joi.string().min(1).max(1000).required()
});

const { error } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check your DATABASE_URL format
# For Supabase: postgresql://postgres:[password]@[host]:5432/postgres
# For local: postgresql://postgres:postgres@localhost:5432/postgres
```

#### 2. Missing Vector Extension
```sql
-- Run this in your production database
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 3. Oso Cloud Authorization Fails
- Verify your API key is correct
- Check that facts are loaded in Oso Cloud
- Test authorization in Oso Cloud console

#### 4. OpenAI API Errors
- Check your API key has sufficient credits
- Verify the key has access to required models
- Monitor rate limits

### Debug Mode

Enable debug logging:

```bash
# Add to environment variables
DEBUG=1
```

## Cost Optimization

### Database Costs
- Use connection pooling
- Optimize vector indexes
- Archive old embeddings

### OpenAI Costs
- Cache embeddings when possible
- Use smaller models for development
- Implement request deduplication

### Vercel Costs
- Monitor function execution time
- Optimize API response size
- Use edge functions for simple operations

## Scaling Considerations

### 1. Database Scaling
- Read replicas for heavy read workloads
- Partitioning for large datasets
- Vector index optimization

### 2. API Scaling
- Implement caching layers
- Use Vercel Edge Functions
- Consider serverless databases

### 3. Authorization Scaling
- Cache Oso decisions
- Batch authorization checks
- Optimize policy complexity

## Next Steps

1. **Monitor Usage**: Set up alerts for errors and performance
2. **Add Features**: User authentication, conversation history, file uploads
3. **Optimize Performance**: Implement caching and optimize queries
4. **Scale**: Add more regions, users, and data sources

## Support

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Oso Cloud**: [docs.osohq.com](https://docs.osohq.com)
- **OpenAI**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs) 