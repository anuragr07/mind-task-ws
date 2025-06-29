// Import the Express app from app.ts
import app from './app';
import { errorHandler } from './middlewares/errorHandler';

// Import routes
// import userRouter from './routes/userRouter';
import routes from './routes/routes';


// Define the port to listen on, defaulting to 3000 if not specified in environment variables
import config from './config/config';
const serverPort = config.server.port;


// Get request handler
app.get('/', (req, res) => {
    res.send({ Server: 'Running' })
});

// ROUTES
// app.use('/user', userRouter);
// This will immport all the routes from our app
app.use(`/${config.server.prefix}`, routes)

// Adding ErrorHandler (must be added just before the app.listen)
app.use(errorHandler)

// Start the server and listen on the specified port
app.listen(serverPort, async () => {
    // Add await database connection
    console.log(`Server listening on port ${serverPort}`)
});
