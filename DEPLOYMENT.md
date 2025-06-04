# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Collect all required API keys

## Required Environment Variables

Set these in your Vercel project settings:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Pinecone API Key
PINECONE_API_KEY=pcsk_2ctn8k_JFWLTgkdcY1Mi2R2jNfsceQjNgaxSAL5CgtzFmNwnFcKcgaLUT6yLeepxXHL6cg

# Oso Cloud API Key
OSO_CLOUD_API_KEY=oso_cld_015HTkCJI3wMSJYL5vZDt2kdGdCqy1yxVS4YXhc5q0vb1VZpMvbXQOqg7M6lJv8n_w
OSO_CLOUD_URL=https://cloud.osohq.com

# Database URL (for hosted database)
DATABASE_URL=your-hosted-database-url
```

## Database Migration

⚠️ **Important**: SQLite doesn't work on Vercel. You have two options:

### Option 1: Use Hosted Database (Recommended)

1. **Neon (PostgreSQL)**: Free tier available
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Get connection string
   - Update `DATABASE_URL` in Vercel

2. **PlanetScale (MySQL)**: 
   - Sign up at [planetscale.com](https://planetscale.com)
   - Create database
   - Get connection string

3. **Supabase (PostgreSQL)**:
   - Sign up at [supabase.com](https://supabase.com)
   - Create project
   - Get connection string

### Option 2: Keep SQLite for Demo

If you want to keep the current SQLite setup for demonstration:

1. **Upload Database**: The current `dev.db` file will be included in deployment
2. **Read-Only Mode**: Database will be read-only (no new data can be added)
3. **Best for Demo**: Existing 200+ embeddings will work perfectly

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration

### 3. Configure Environment Variables
1. In Vercel dashboard → Project Settings → Environment Variables
2. Add all the variables listed above
3. Set for "Production" environment

### 4. Deploy
1. Vercel will automatically deploy
2. Your app will be available at `your-project.vercel.app`

## Post-Deployment

### Test the Application
1. Visit your Vercel URL
2. Test user selection and chat functionality
3. Verify authorization is working correctly
4. Check that embeddings are being retrieved

### Monitor Performance
- Check Vercel dashboard for function execution times
- Monitor API response times
- Watch for any timeout errors

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Ensure database is accessible from Vercel

2. **API Timeouts**
   - Function timeout is set to 60 seconds
   - OpenAI API calls can be slow
   - Consider caching for better performance

3. **Environment Variables**
   - Double-check all API keys are set
   - Ensure no trailing spaces or quotes

### Expected Performance
- ✅ **Pinecone**: Works perfectly on serverless
- ✅ **OpenAI**: Compatible with Vercel
- ✅ **Oso Cloud**: Works on serverless
- ⚠️ **SQLite**: Read-only on Vercel

## Architecture on Vercel

```
Frontend (Static) → Vercel Edge Network
API Routes → Vercel Serverless Functions
Database → SQLite (read-only) OR Hosted DB
Vector Store → Pinecone (fully functional)
Authorization → Oso Cloud (fully functional)
```

## Current Status

Your application is ready to deploy with:
- 📊 200+ embeddings in Pinecone
- 🔐 Fine-grained authorization with Oso Cloud
- 👥 12 clients across 2 regions
- 🎯 Working RAG functionality
- 📱 Beautiful responsive UI

Simply push to GitHub and connect to Vercel! 