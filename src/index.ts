import express from 'express';
import { createServer } from 'http';
import usersRouters from '~/routers/accountsRouters';
import mediasRouters from '~/routers/mediasRouters';
import payRouters from '~/routers/payRouter';
import conversationsRouters from '~/routers/conversationsRouters';
import packagesRouters from '~/routers/packageRouter';
import transactionRouters from '~/routers/transactionsRouter';
import applyRouters from '~/routers/applyJobRouters';
import jobsRouters from '~/routers/jobsRouters';
import adminsRouter from '~/routers/adminRouters';
import employersRouter from '~/routers/employerRouters';
import db from './services/databaseServices';
import { defaultsErrorHandler } from './middlewares/errorsMiddlewares';
import cors, { CorsOptions } from 'cors';
import initializeSocket from './utils/socket';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { env, isProduction } from './constants/config';
import helmet from 'helmet';
import othersRouters from './routers/othersRouter';
import candidatesRouters from './routers/candidatesRouters';
const app = express();
const httpServer = createServer(app);

const corsConfig: CorsOptions = {
  origin: isProduction ? env.clientUrl : '*'
};

app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json());

initializeSocket(httpServer);

app.use('/users', usersRouters);
app.use('/payment', payRouters);
app.use('/medias', mediasRouters);
app.use('/jobs', jobsRouters);
app.use('/others', othersRouters);
app.use('/candidates', candidatesRouters);
app.use('/admins', adminsRouter);
app.use('/employers', employersRouter);
app.use('/chats', conversationsRouters);
app.use('/package', packagesRouters);
app.use('/transaction', transactionRouters);
app.use('/apply', applyRouters);

app.use(defaultsErrorHandler);

const port = env.port || 3030;
httpServer.listen(port, () => console.log('JobHub server is running port: ' + port));
