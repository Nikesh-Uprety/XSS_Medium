require('dotenv').config();
const express = require('express');
const csrf = require('csurf');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const app = express();
const port = 3000;

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run('CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT)');
});

// Clear messages every 1 minute (60,000 milliseconds)
setInterval(() => {
  db.run('DELETE FROM messages', (err) => {
    if (err) {
      console.error('Error clearing messages:', err.message);
    } else {
      console.log('Guestbook messages cleared');
    }
  });
}, 60000);

// Middleware to parse form data and serve static content
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(csrf());

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
          /* General Styles */
          :root {
            --main-bg-color: #0a0a0a;
            --secondary-bg-color: #121212;
            --terminal-bg-color: rgba(16, 16, 16, 0.9);
            --neon-green: #00ff41;
            --neon-blue: #0084ff;
            --neon-purple: #be00ff;
            --neon-red: #ff003c;
            --text-primary: #e0e0e0;
            --text-secondary: #a0a0a0;
            --terminal-green: #33ff33;
            --card-bg: rgba(18, 18, 18, 0.8);
            --card-border: rgba(42, 42, 42, 0.8);
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Courier New', monospace;
            background-color: var(--main-bg-color);
            color: var(--text-primary);
            line-height: 1.6;
            overflow-x: hidden;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
          }

          canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            opacity: 0.15;
          }

          /* Glitch Effect for Header */
          .glitch-container {
            position: relative;
            display: inline-block;
            margin-bottom: 1rem;
          }

          h1 {
            font-size: 27px;
            font-weight: bold;
            text-transform: uppercase;
            position: relative;
            letter-spacing: 2px;
            color: var(--text-primary);
            animation: glitch-skew 1s infinite linear alternate-reverse;
          }

          h1::before,
          h1::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          h1::before {
            left: 2px;
            text-shadow: -2px 0 var(--neon-red);
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim 5s infinite linear alternate-reverse;
          }

          h1::after {
            left: -2px;
            text-shadow: -2px 0 var(--neon-blue);
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim2 5s infinite linear alternate-reverse;
          }

          h2 {
            font-size: 1.8rem;
            font-weight: bold;
            text-transform: uppercase;
            position: relative;
            letter-spacing: 2px;
            color: var(--text-primary);
            animation: glitch-skew 1s infinite linear alternate-reverse;
          }

          h2::before,
          h2::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          h2::before {
            left: 1px;
            text-shadow: -1px 0 var(--neon-red);
            clip: rect(24px, 450px, 30px, 0);
            animation: glitch-anim 5s infinite linear alternate-reverse;
          }

          h2::after {
            left: -1px;
            text-shadow: -1px 0 var(--neon-blue);
            clip: rect(24px, 450px, 30px, 0);
            animation: glitch-anim2 5s infinite linear alternate-reverse;
          }

          /* Guestbook Container */
          .guestbook-container {
            background-color: var(--terminal-bg-color);
            border-radius: 6px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            padding: 2rem;
            border: 1px solid var(--card-border);
            max-width: 700px;
            width: 100%;
            position: relative;
            z-index: 2;
          }

          /* Message Form */
          .message-form {
            margin-bottom: 2rem;
          }

          .form-label {
            font-size: 1rem;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
            display: block;
          }

          input[type="text"], input[type="url"] {
            width: 100%;
            padding: 0.8rem;
            margin-bottom: 1rem;
            border: 1px solid var(--card-border);
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 1rem;
            background-color: var(--secondary-bg-color);
            color: var(--text-primary);
            transition: border-color 0.3s ease;
          }

          input[type="text"]:focus, input[type="url"]:focus {
            border-color: var(--neon-green);
            outline: none;
            box-shadow: 0 0 8px var(--neon-green);
          }

          /* Neon Button */
          button {
            position: relative;
            display: inline-block;
            padding: 10px 30px;
            color: var(--text-primary);
            text-transform: uppercase;
            letter-spacing: 2px;
            text-decoration: none;
            font-size: 1rem;
            font-family: 'Courier New', monospace;
            background-color: transparent;
            border: 1px solid var(--neon-green);
            border-radius: 4px;
            cursor: pointer;
            overflow: hidden;
            transition: 0.2s;
          }

          button:hover {
            color: var(--main-bg-color);
            background: var(--neon-green);
            box-shadow: 0 0 10px var(--neon-green), 0 0 40px var(--neon-green), 0 0 80px var(--neon-green);
            transition-delay: 1s;
          }

          button span {
            position: absolute;
            display: block;
          }

          button span:nth-child(1) {
            top: 0;
            left: -100%;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--neon-green));
          }

          button:hover span:nth-child(1) {
            left: 100%;
            transition: 1s;
          }

          button span:nth-child(2) {
            top: -100%;
            right: 0;
            width: 2px;
            height: 100%;
            background: linear-gradient(180deg, transparent, var(--neon-green));
          }

          button:hover span:nth-child(2) {
            top: 100%;
            transition: 1s;
            transition-delay: 0.25s;
          }

          button span:nth-child(3) {
            bottom: 0;
            right: -100%;
            width: 100%;
            height: 2px;
            background: linear-gradient(270deg, transparent, var(--neon-green));
          }

          button:hover span:nth-child(3) {
            right: 100%;
            transition: 1s;
            transition-delay: 0.5s;
          }

          button span:nth-child(4) {
            bottom: -100%;
            left: 0;
            width: 2px;
            height: 100%;
            background: linear-gradient(360deg, transparent, var(--neon-green));
          }

          button:hover span:nth-child(4) {
            bottom: 100%;
            transition: 1s;
            transition-delay: 0.75s;
          }

          /* Messages Section */
          .message-section {
            margin-top: 2rem;
          }

          .messages {
            max-height: 200px;
            min-height: 100px;
            overflow-y: auto;
            padding: 1rem;
            border: 1px solid var(--card-border);
            border-radius: 4px;
            background-color: var(--secondary-bg-color);
          }

          .messages::-webkit-scrollbar {
            width: 6px;
          }

          .messages::-webkit-scrollbar-track {
            background: var(--secondary-bg-color);
            border-radius: 3px;
          }

          .messages::-webkit-scrollbar-thumb {
            background: var(--neon-green);
            border-radius: 3px;
          }

          .messages::-webkit-scrollbar-thumb:hover {
            background: var(--terminal-green);
          }

          .message {
            border-bottom: 1px solid var(--card-border);
            padding: 0.5rem 0;
            font-size: 1rem;
            color: var(--text-primary);
            word-wrap: break-word;
          }

          /* Animations */
          @keyframes glitch-anim {
            0% { clip: rect(13px, 9999px, 76px, 0); transform: skew(0.58deg); }
            5% { clip: rect(65px, 9999px, 13px, 0); transform: skew(0.69deg); }
            10% { clip: rect(84px, 9999px, 66px, 0); transform: skew(0.58deg); }
            15% { clip: rect(112px, 9999px, 59px, 0); transform: skew(0.78deg); }
            20% { clip: rect(26px, 9999px, 48px, 0); transform: skew(0.21deg); }
            25% { clip: rect(33px, 9999px, 5px, 0); transform: skew(0.9deg); }
            30% { clip: rect(126px, 9999px, 34px, 0); transform: skew(0.02deg); }
            35% { clip: rect(35px, 9999px, 23px, 0); transform: skew(0.07deg); }
            40% { clip: rect(32px, 9999px, 41px, 0); transform: skew(0.53deg); }
            45% { clip: rect(83px, 9999px, 40px, 0); transform: skew(0.58deg); }
            50% { clip: rect(118px, 9999px, 99px, 0); transform: skew(0.19deg); }
            55% { clip: rect(9px, 9999px, 29px, 0); transform: skew(0.95deg); }
            60% { clip: rect(23px, 9999px, 5px, 0); transform: skew(0.05deg); }
            65% { clip: rect(103px, 9999px, 13px, 0); transform: skew(0.6deg); }
            70% { clip: rect(126px, 9999px, 84px, 0); transform: skew(0.28deg); }
            75% { clip: rect(27px, 9999px, 95px, 0); transform: skew(0.53deg); }
            80% { clip: rect(39px, 9999px, 83px, 0); transform: skew(0.1deg); }
            85% { clip: rect(70px, 9999px, 101px, 0); transform: skew(0.58deg); }
            90% { clip: rect(50px, 9999px, 86px, 0); transform: skew(0.84deg); }
            95% { clip: rect(62px, 9999px, 62px, 0); transform: skew(0.98deg); }
            100% { clip: rect(39px, 9999px, 73px, 0); transform: skew(0.32deg); }
          }

          @keyframes glitch-anim2 {
            0% { clip: rect(76px, 9999px, 77px, 0); transform: skew(0.11deg); }
            5% { clip: rect(44px, 9999px, 33px, 0); transform: skew(0.03deg); }
            10% { clip: rect(107px, 9999px, 63px, 0); transform: skew(0.76deg); }
            15% { clip: rect(84px, 9999px, 79px, 0); transform: skew(0.72deg); }
            20% { clip: rect(101px, 9999px, 27px, 0); transform: skew(0.13deg); }
            25% { clip: rect(114px, 9999px, 93px, 0); transform: skew(0.61deg); }
            30% { clip: rect(124px, 9999px, 114px, 0); transform: skew(0.14deg); }
            35% { clip: rect(52px, 9999px, 17px, 0); transform: skew(0.52deg); }
            40% { clip: rect(98px, 9999px, 56px, 0); transform: skew(0.7deg); }
            45% { clip: rect(40px, 9999px, 28px, 0); transform: skew(0.02deg); }
            50% { clip: rect(123px, 9999px, 61px, 0); transform: skew(0.38deg); }
            55% { clip: rect(105px, 9999px, 13px, 0); transform: skew(0.43deg); }
            60% { clip: rect(24px, 9999px, 17px, 0); transform: skew(0.41deg); }
            65% { clip: rect(2px, 9999px, 117px, 0); transform: skew(0.78deg); }
            70% { clip: rect(121px, 9999px, 95px, 0); transform: skew(0.24deg); }
            75% { clip: rect(104px, 9999px, 61px, 0); transform: skew(0.92deg); }
            80% { clip: rect(112px, 9999px, 36px, 0); transform: skew(0.83deg); }
            85% { clip: rect(26px, 9999px, 2px, 0); transform: skew(0.04deg); }
            90% { clip: rect(124px, 9999px, 119px, 0); transform: skew(0.54deg); }
            95% { clip: rect(82px, 9999px, 28px, 0); transform: skew(0.3deg); }
            100% { clip: rect(123px, 9999px, 90px, 0); transform: skew(0.3deg); }
          }

          @keyframes glitch-skew {
            0% { transform: skew(0deg); }
            10% { transform: skew(-0.5deg); }
            20% { transform: skew(0.3deg); }
            30% { transform: skew(0deg); }
            40% { transform: skew(-0.3deg); }
            50% { transform: skew(0.5deg); }
            60% { transform: skew(0deg); }
            70% { transform: skew(0.7deg); }
            80% { transform: skew(-0.2deg); }
            90% { transform: skew(0.4deg); }
            100% { transform: skew(0deg); }
          }

          /* Responsive Styles */
          @media (max-width: 768px) {
            h1 {
              font-size: 2.5rem;
            }
            h2 {
              font-size: 1.5rem;
            }
            .guestbook-container {
              padding: 1.5rem;
            }
          }

          @media (max-width: 576px) {
            h1 {
              font-size: 2rem;
            }
            h2 {
              font-size: 1.2rem;
            }
            input[type="text"], input[type="url"], button {
              font-size: 0.9rem;
            }
          }
        </style>
      </head>
      <body>
        <canvas id="matrix"></canvas>
        <div class="guestbook-container">
          <div class="glitch-container">
            <h1 data-text="Attack-On-Hash-Function Guestbook">Attack-On-Hash-Function Guestbook</h1>
          </div>
          <div class="message-form">
            <h2 data-text="Drop a Message">Drop a Message</h2>
            <form action="/message" method="POST">
              <label class="form-label" for="message">Your Message</label>
              <input type="text" id="message" name="message" placeholder="Share your thoughts or hacks..." required>
              <label class="form-label" for="profileLink">Your Profile Link (optional)</label>
              <input type="url" id="profileLink" name="profileLink" placeholder="e.g., https://your-hacker-portfolio.com">
              <button type="submit"><span></span><span></span><span></span><span></span>Submit Message</button>
            </form>
          </div>
          <div class="message-section">
            <h2 data-text="Community Messages">Community Messages</h2>
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
    const flag = process.env.FLAG || 'FLAG{guestbook_default_flag}';
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