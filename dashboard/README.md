# Educational Bot Dashboard - Implementation

A minimal proof-of-concept dashboard for educational Discord bot interaction, as described in the bachelor thesis.

## Features

This minimal implementation provides:

- **WebSocket Communication**: Real-time bidirectional communication between bot and dashboard
- **Class Management**: Basic class start/end functionality
- **Real-time Events**: Display student interactions (join, questions, poll responses)
- **Discussions**: Start discussions messages from dashboard to Discord via bot
- **Polls**: Create basic polls that students can respond to
- **Status Monitoring**: Connection status for bot and dashboard

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Discord Bot Token
- Discord server where the bot has permissions

### Setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
export DISCORD_TOKEN="your_discord_bot_token"
export DASHBOARD_WS_URL="ws://localhost:3001"  # Optional, defaults to localhost:3001
```

3. Start the dashboard server:

```bash
npm run dev
```

4. In another terminal, start the bot:

```bash
cd ../bot
export DISCORD_TOKEN="your_discord_bot_token"
make && ./main
```

5. Open your browser to `http://localhost:3001`

## Usage

### Dashboard Interface

The dashboard provides a simple web interface with:

- **Status Cards**: Show connection status of bot and dashboard
- **Class Controls**: Start/end class sessions with custom titles and codes
- **Discussions**: Send discussion messages that the bot will relay to Discord
- **Polls**: Create polls with multiple choice options
- **Real-time Events**: View live stream of student interactions

### Discord Bot Commands

Students can interact with the bot using these commands:

- `!join <class_code>` - Join a class session
- `!ask <question>` - Ask an anonymous question
- `!poll <option>` - Vote in a poll
- `!help` - Show available commands

## Architecture

The system uses a pure WebSocket-based architecture:

```txt
Discord Students ↔ Discord Bot ↔ WebSocket ↔ Dashboard ↔ Web Teachers
```

### Message Flow

1. **Bot to Dashboard**: Student interactions generate events sent to dashboard
2. **Dashboard to Bot**: Teacher actions generate commands sent to bot
3. **Real-time Updates**: All interactions are displayed in real-time on the dashboard

### Message Format

All WebSocket messages follow this JSON structure:

```json
{
  "event": "event_name",
  "data": {
    // Event-specific payload
  }
}
```

## Limitations

This minimal implementation focuses on core functionality and does **not** include:

- User authentication
- Database persistence
- Complex routing
- Advanced security features
- File uploads
- Analytics/reporting
- Multi-class management
- Advanced error handling

These limitations are intentional to keep the implementation simple and focused on demonstrating the core concept described in the thesis.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
