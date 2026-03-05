import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import authRoutes from './routes/auth.routes';
import connectionsRoutes from './routes/connections.routes';
import terminalRoutes from './routes/terminal.routes';
import sftpRoutes from './routes/sftp.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/sftp', sftpRoutes);

// Error handling
app.use(errorMiddleware);

export default app;
