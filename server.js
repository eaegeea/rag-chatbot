import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chatHandler from './api/chat.js';
import clientsHandler from './api/clients.js';
import clientsByUserHandler from './api/clients-by-user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// API Routes
app.post('/api/chat', chatHandler);
app.get('/api/clients', clientsHandler);
app.post('/api/clients-by-user', clientsByUserHandler);

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`🔌 API endpoints available at: http://localhost:${PORT}/api/*`);
}); 