// Import the Express app from app.ts
import app from './app';
import { errorHandler } from './middlewares/errorHandler';

// Import routes
import userRoute from './routes/userRoute';


// Define the port to listen on, defaulting to 3000 if not specified in environment variables
import config from './config/config';
const serverPort = config.server.port;


// Get request handler
app.get('/', (req, res) => {
    res.send({ Server: 'Running' })
});

// ROUTES
app.use('/user', userRoute);

// Adding ErrorHandler (must be added just before the app.listen)
app.use(errorHandler)

// Start the server and listen on the specified port
app.listen(serverPort, async () => {
    // Add await database connection
    console.log(`Server listening on port ${serverPort}`)
});
