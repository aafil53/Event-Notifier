const express = require('express'); // Import Express
const WebSocket = require('ws');   // Import WebSocket
const cron = require('node-cron'); // Import node-cron for scheduling
const fs = require('fs');          // Import fs for file handling

const app = express();             // Initialize Express app
const port = 3000;                 // Port for the server

app.use(express.json());           // Enable JSON body parsing

let events = []; // In-memory storage for events

// POST /events - Add an event
app.post('/events', (req, res) => {
  const { title, description, time } = req.body; // Get data from the request
  if (!title || !description || !time) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const event = { id: events.length + 1, title, description, time: new Date(time) };
  events.push(event); // Save the event
  res.status(201).json({ message: 'Event created', event });
});

// GET /events - Fetch all events
app.get('/events', (req, res) => {
  const now = new Date();
  const upcomingEvents = events.filter(event => event.time > now);
  res.status(200).json(upcomingEvents);
});

// Set up WebSocket server
const wss = new WebSocket.Server({ port: 3001 }); // WebSocket on port 3001

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.send('Connected to Event Notifier!');
});

cron.schedule('* * * * *', () => {
    const now = new Date();
    events.forEach(event => {
      const timeDiff = (new Date(event.time) - now) / (1000 * 60); // Time in minutes
      if (timeDiff > 0 && timeDiff <= 5) { // Event is within 5 minutes
        wss.clients.forEach(client => {
          client.send(`Reminder: Event "${event.title}" starts in ${Math.ceil(timeDiff)} minutes.`);
        });
      }
    });
  });
  
  function logEvent(event) {
    const logData = `Event "${event.title}" completed at ${new Date()}\n`;
    fs.appendFile('completed-events.log', logData, (err) => {
      if (err) console.error('Error writing to log file:', err);
    });
  }
  
  cron.schedule('* * * * *', () => {
    const now = new Date();
    events = events.filter(event => {
      if (event.time < now) {
        logEvent(event); // Log the completed event
        return false; // Remove event from memory
      }
      return true; // Keep upcoming events
    });
  });

  
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
  
  