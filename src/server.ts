// Import the Express app from app.ts
import app from './app';
import config from './config/config';

// Define the port to listen on, defaulting to 3000 if not specified in environment variables
const serverPort = config.server.port;

// Import routes
import userRoute from './routes/userRoute';

// Get request handler
app.get('/', (req, res) => {
    res.send({ Server: 'Running' })
});

// ROUTES
app.use('/user', userRoute);

// Start the server and listen on the specified port
app.listen(serverPort, async () => {
    // Add await database connection
    console.log(`Server listening on port ${serverPort}`)
});
