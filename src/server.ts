// Import the Express app from app.ts
import app from './app';

// Define the port to listen on, defaulting to 3000 if not specified in environment variables
const serverPort = process.env.SERVER_PORT || 8000;

// Get request handler
app.get('/', (req, res) => {
    res.send({ Server: 'Running' })
});

// Start the server and listen on the specified port
app.listen(serverPort, async () => {
    // Add await database connection
    console.log(`Server listening on port ${serverPort}`)
});
