require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const app = express();
const port = 3000;

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run('CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT)');
});

// Middleware to parse form data and serve static content
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic XSS filter (blocks common payloads but allows specific vectors)
function filterXSS(input) {
    return input
        .replace(/<script/gi, '<script')
        .replace(/<\/script/gi, '</script')
        .replace(/on\w+ *= */gi, 'forbidden')
        .replace(/javascript:/gi, 'forbidden:')
        .replace(/alert/gi, 'forbidden');
}

// Serve the main guestbook page
app.get('/', (req, res) => {
    db.all('SELECT message FROM messages', [], (err, rows) => {
        if (err) {
            return res.status(500).send('Database error');
        }
        const messages = rows.map(row => `<div class="message">${row.message}</div>`).join('');
        const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Attack-On-Hash-Function Guestbook</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            background-color: #000;
            color: #33cc33;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            position: relative;
            overflow: hidden;
          }
          canvas {
            position: fixed;
            top: 0;
            left: 0;
            z-index: -1;
            opacity: 0.3;
          }
          h1 {
            color: #33cc33;
            text-align: center;
            font-size: 2em;
            margin-bottom: 15px;
            text-shadow: 0 0 8px #339933;
          }
          .guestbook-container {
            background: rgba(0, 15, 0, 0.8);
            padding: 20px;
            border: 2px solid #339933;
            border-radius: 8px;
            box-shadow: 0 0 12px #339933;
            max-width: 700px;
            width: 100%;
          }
          .message-form {
            margin-bottom: 20px;
          }
          .message {
            border-bottom: 1px solid #339933;
            padding: 10px 0;
            font-size: 1em;
            line-height: 1.4;
            word-wrap: break-word;
          }
          .messages {
            max-height: 120px;
            min-height: 80px;
            overflow-y: auto;
            padding: 8px;
            border: 1px solid #339933;
            border-radius: 5px;
            background: #001100;
          }
          .messages::-webkit-scrollbar {
            width: 6px;
          }
          .messages::-webkit-scrollbar-track {
            background: #001100;
            border-radius: 3px;
          }
          .messages::-webkit-scrollbar-thumb {
            background: #339933;
            border-radius: 3px;
          }
          .messages::-webkit-scrollbar-thumb:hover {
            background: #33cc33;
          }
          input[type="text"], input[type="url"] {
            width: 100%;
            padding: 8px;
            margin: 8px 0;
            border: 1px solid #339933;
            border-radius: 4px;
            font-size: 0.9em;
            font-family: 'Courier New', monospace;
            background: #001100;
            color: #33cc33;
          }
          button {
            background-color: #339933;
            color: #000;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            font-family: 'Courier New', monospace;
            box-shadow: 0 0 8px #339933;
          }
          button:hover {
            background-color: #33cc33;
            box-shadow: 0 0 12px #33cc33;
          }
          .form-label {
            font-weight: bold;
            margin-bottom: 4px;
            display: block;
            color: #33cc33;
            font-size: 0.9em;
          }
          .message-section {
            margin-top: 20px;
          }
          .message-section h2 {
            color: #33cc33;
            font-size: 1.5em;
            margin-bottom: 15px;
            text-shadow: 0 0 4px #339933;
          }
        </style>
      </head>
      <body>
        <canvas id="matrix"></canvas>
        <div class="guestbook-container">
          <h1>Attack-On-Hash-Function Guestbook</h1>
          <div class="message-form">
            <h2>Drop a Message</h2>
            <form action="/message" method="POST">
              <label class="form-label" for="message">Your Message</label>
              <input type="text" id="message" name="message" placeholder="Share your thoughts or hacks..." required>
              <label class="form-label" for="profileLink">Your Profile Link (optional)</label>
              <input type="url" id="profileLink" name="profileLink" placeholder="e.g., https://your-hacker-portfolio.com">
              <button type="submit">Submit Message</button>
            </form>
          </div>
          <div class="message-section">
            <h2>Community Messages</h2>
            <div class="messages">${messages}</div>
          </div>
        </div>
        <script>
          // Matrix digital rain animation
          const canvas = document.getElementById('matrix');
          const ctx = canvas.getContext('2d');
          canvas.height = window.innerHeight;
          canvas.width = window.innerWidth;
          const chars = '01ハックAttack-On-Hash-Function!#$%';
          const fontSize = 14;
          const columns = canvas.width / fontSize;
          const drops = [];
          for (let x = 0; x < columns; x++) drops[x] = 1;
          function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#33cc33';
            ctx.font = fontSize + 'px monospace';
            for (let i = 0; i < drops.length; i++) {
              const text = chars.charAt(Math.floor(Math.random() * chars.length));
              ctx.fillText(text, i * fontSize, drops[i] * fontSize);
              if (drops[i] * fontSize > canvas.height && Math.random() > 0.975)
                drops[i] = 0;
              drops[i]++;
            }
          }
          setInterval(draw, 33);
          window.addEventListener('resize', () => {
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
          });
        </script>
      </body>
      </html>
    `;
        res.send(html);
    });
});

// Handle message submission
app.post('/message', (req, res) => {
    const { message, profileLink } = req.body;
    if (!message) {
        return res.status(400).send('Message is required');
    }
    if (profileLink && !profileLink.match(/^https?:\/\//)) {
        return res.status(400).send('Profile link must be a valid HTTP/HTTPS URL');
    }
    const filteredMessage = filterXSS(message);
    db.run('INSERT INTO messages (message) VALUES (?)', [filteredMessage], async (err) => {
        if (err) {
            return res.status(500).send('Error saving message');
        }
        // Simulate admin bot visiting the page
        if (profileLink) {
            await simulateAdminBot(profileLink, filteredMessage);
        }
        res.redirect('/');
    });
});

// Simulate admin bot visiting the page and executing payloads
async function simulateAdminBot(profileLink, message) {
    try {
        // Log the message being processed
        console.log('Admin bot processing message:', message);
        const flag = process.env.FLAG ;
        // Simulate cookie with flag
        const adminCookie = `session=admin; flag=${flag}`;
        // Check for common XSS payload patterns
        if (message.includes('fetch') || message.includes('document.cookie') || message.includes('onerror') || message.includes('onload')) {
            console.log('XSS payload detected, sending cookie to:', profileLink);
            try {
                // Simulate the fetch request from the payload
                await axios.get(`${profileLink}?cookie=${encodeURIComponent(adminCookie)}`, {
                    timeout: 5000 // Add timeout to prevent hanging
                });
                console.log('Successfully sent cookie to:', profileLink);
            } catch (error) {
                console.error('Error sending to profile link:', error.message);
            }
        } else {
            console.log('No XSS payload detected in message');
        }
    } catch (error) {
        console.error('Bot error:', error.message);
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});