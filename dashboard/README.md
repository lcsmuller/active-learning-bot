# Educational Bot Dashboard

A web-based dashboard for monitoring and managing the Educational Discord Bot. Built with Node.js, Express, and WebSocket for real-time communication.

## Overview

This dashboard provides a web interface for monitoring Discord bot activities, managing educational interactions, and analyzing bot performance. It communicates with the Discord bot through WebSocket connections to provide real-time updates and control capabilities.

## Features

- 🌐 **Web Interface**: Clean, responsive web dashboard
- 🔄 **Real-time Updates**: WebSocket communication with Discord bot
- 📊 **Activity Monitoring**: Live tracking of bot interactions
- 🔐 **Demo Authentication**: Simple login system for demonstration
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔌 **WebSocket Integration**: Bidirectional communication with bot

## Tech Stack

- **Backend**: Node.js with Express.js
- **WebSockets**: `ws` library for real-time communication
- **Sessions**: Express-session for session management
- **Frontend**: Vanilla JavaScript with modular components
- **Styling**: CSS with responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. **Install Dependencies**:

   ```bash
   npm install
   ```

## Configuration

The dashboard uses demo credentials by default:

- **Email**: `demo@ufpr.br`
- **Password**: `demo`

You can modify these in `server.js`:

```javascript
const DEMO_CREDENTIALS = {
  email: 'demo@ufpr.br',
  password: 'demo'
};
```

## Running

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The dashboard will be available at `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server
- `npm start` - Start production server  
- `npm run build` - Build dashboard (currently informational)

## Architecture

### Server Components

- **Express Server**: Main web server handling HTTP requests
- **WebSocket Server**: Real-time communication with Discord bot
- **Session Management**: User authentication and session handling
- **Static File Serving**: Serves frontend assets

### Frontend Structure

```text
public/
├── index.html              # Main dashboard page
├── components/             # Modular UI components
├── css/                    # Stylesheets
└── js/                     # JavaScript modules
```

### API Endpoints

- `POST /login` - User authentication
- `POST /logout` - User logout
- `GET /dashboard` - Main dashboard page (requires auth)
- `WS /ws` - WebSocket endpoint for bot communication

## WebSocket Communication

The dashboard communicates with the Discord bot through WebSocket messages:

### Bot → Dashboard

- Connection status updates
- Discord event notifications
- User interaction data
- Error reports and logging

### Dashboard → Bot

- Configuration updates
- Command execution requests
- Status queries

## Dashboard Features

### Authentication

Simple demo authentication system for accessing the dashboard. Users must log in with demo credentials to access monitoring features.

### Real-time Monitoring

- Live display of bot connection status
- Real-time Discord event tracking
- User interaction monitoring
- Error and warning notifications

### Responsive Design

The dashboard adapts to different screen sizes and devices, ensuring usability on both desktop and mobile platforms.

## Development

### Project Structure

```text
dashboard/
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── webpack.config.js       # Build configuration
├── railway.json            # Deployment configuration
└── public/                 # Frontend assets
    ├── index.html
    ├── components/
    ├── css/
    └── js/
```

### Adding New Features

1. **Backend**: Modify `server.js` for new endpoints or WebSocket handlers
2. **Frontend**: Add components in `public/components/`
3. **Styling**: Update CSS files for visual changes
4. **WebSocket**: Extend message handling for bot communication

## Deployment

The project includes configuration for Railway deployment (`railway.json`), but can be deployed to any Node.js hosting platform.

## Integration with Bot

The dashboard is designed to work with the C-based Discord bot. Ensure:

1. Bot is configured to connect to dashboard WebSocket endpoint
2. Dashboard is running before starting the bot
3. Network connectivity between bot and dashboard
4. Proper WebSocket message format compatibility

## Logging

The dashboard logs important events to the console:

- WebSocket connections and disconnections
- Authentication attempts
- Error conditions
- Bot communication events

## License

Part of the Educational Discord Bot Bachelor Thesis Project - UFPR
