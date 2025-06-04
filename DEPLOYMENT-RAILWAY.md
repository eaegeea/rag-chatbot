# Railway Deployment Guide (SQLite Compatible)

## Why Railway?
Railway supports persistent file storage, making it perfect for SQLite databases. Your current architecture will work without any changes!

## Prerequisites
1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Current Setup**: Your SQLite database and 200+ embeddings will work perfectly

## Step 1: Prepare Your Repository

First, let's create a railway.json configuration file:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 2: Environment Variables

You'll need these environment variables in Railway:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Pinecone API Key  
PINECONE_API_KEY=pcsk_2ctn8k_JFWLTgkdcY1Mi2R2jNfsceQjNgaxSAL5CgtzFmNwnFcKcgaLUT6yLeepxXHL6cg

# Oso Cloud API Key
OSO_CLOUD_API_KEY=e_486CwrIBvZEK0MTGMHfzxQ_BAqfPc4beuh_1XsMcMHij16QLi7pyP1vgL1odiZv
OSO_CLOUD_URL=https://cloud.osohq.com

# Database URL (Railway will provide persistent storage)
DATABASE_URL=file:./dev.db

# Port (Railway will provide this)
PORT=3000
```

## Step 3: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository

2. **Configure Environment Variables**:
   - In Railway dashboard → Your Project → Variables
   - Add all the environment variables listed above
   - Railway will automatically detect it's a Node.js project

3. **Deploy**:
   - Railway will automatically build and deploy
   - Your SQLite database will be persistent across deploys

### Option B: Deploy with Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set OPENAI_API_KEY=sk-your-openai-api-key-here
railway variables set PINECONE_API_KEY=pcsk_2ctn8k_JFWLTgkdcY1Mi2R2jNfsceQjNgaxSAL5CgtzFmNwnFcKcgaLUT6yLeepxXHL6cg
railway variables set OSO_CLOUD_API_KEY=e_486CwrIBvZEK0MTGMHfzxQ_BAqfPc4beuh_1XsMcMHij16QLi7pyP1vgL1odiZv
railway variables set OSO_CLOUD_URL=https://cloud.osohq.com
railway variables set DATABASE_URL=file:./dev.db

# Deploy
railway deploy
```

## Step 4: Database Persistence

✅ **Great News**: Your SQLite database (`dev.db`) will be automatically backed up and restored on Railway!

- **Persistent Storage**: Railway provides persistent volumes
- **Automatic Backups**: Your database is safe across deployments  
- **No Migration Needed**: Your existing 200+ embeddings work as-is

## Step 5: Verify Deployment

After deployment, test these features:
1. **User Selection**: Different roles (Alice, Bob, Carol, etc.)
2. **Chat Functionality**: RAG responses with proper context
3. **Authorization**: Regional access restrictions working
4. **Embeddings**: All 200+ embeddings accessible

## Alternative Options

If you prefer other platforms:

### Render.com
- Also supports persistent disks
- Similar setup to Railway
- Good SQLite support

### Fly.io  
- Supports volumes for SQLite
- More complex setup but very powerful
- Great for production apps

## Architecture on Railway

```
Your App → Railway Server (with persistent disk)
├── SQLite Database (persistent) ✅
├── Express.js Server ✅  
├── Static Files (HTML/CSS/JS) ✅
├── Pinecone Integration ✅
└── Oso Cloud Authorization ✅
```

## Cost Comparison

| Platform | SQLite Support | Cost | Complexity |
|----------|----------------|------|------------|
| Railway | ✅ Full | $5/month | Low |
| Render | ✅ Full | $7/month | Low |
| Fly.io | ✅ Full | $0-5/month | Medium |
| Vercel | ❌ Read-only | $0-20/month | Medium |

## Ready to Deploy!

Your current setup is perfect for Railway:
- ✅ SQLite database with all data
- ✅ 200+ embeddings in Pinecone  
- ✅ Working authorization system
- ✅ Beautiful UI with chat functionality

**No code changes needed** - just deploy and it works! 🚀 