# Educational Discord Bot

A Discord bot designed for educational interactions and remote learning environments, built with C and the Concord Discord library.

## Overview

This bot facilitates educational interactions on Discord servers, providing features for remote learning scenarios. It communicates with a web dashboard for monitoring and management purposes through WebSocket connections.

## Features

- 🤖 **Discord Integration**: Full Discord API support through Concord library
- 📚 **Educational Commands**: Interactive educational features and commands
- 🌐 **Dashboard Communication**: Real-time WebSocket communication with web dashboard
- 📊 **Activity Logging**: Comprehensive logging of bot activities and interactions
- 🔄 **Auto-reconnection**: Robust connection handling with automatic reconnection

## Architecture

- **Main Bot**: `main.c` - Core bot logic and Discord connection handling
- **Context Management**: `tccbot_context.c` - Bot state and context management
- **Dashboard Integration**: `tccbot_dashboard.c` - WebSocket communication with dashboard
- **Interaction Handling**: `tccbot_interactions-handler.c` - Processing Discord interactions
- **Event Management**: `tccbot_dashboard-events.c` - Dashboard event handling

## Dependencies

- **Concord**: Discord library for C (included as submodule)
- **libcurl**: HTTP/WebSocket client library
- **Standard C libraries**: stdio, stdlib, string, time, unistd

## Building

### Prerequisites

```bash
sudo apt-get update
sudo apt-get install build-essential libcurl4-openssl-dev
```

### Compilation

1. **Setup Dependencies** (first time only):

   ```bash
   make setup
   ./setup
   ```

2. **Build the Bot**:

   ```bash
   make
   ```

This will:

- Build the Concord Discord library
- Compile all bot source files
- Create the `main` executable

## Configuration

### Bot Configuration (`config.json`)

```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "application_id": "YOUR_APPLICATION_ID",
}
```

### Roles Configuration (`roles.json`)

Define Discord roles and permissions for educational features.

## Running

```bash
./main
```

or if you want to connect to a specific dashboard WebSocket URL:

```bash
DASHBOARD_WS_URL="ws://<your-websockets-url>" ./main
```

The bot will:

1. Connect to Discord using the provided token
2. Establish WebSocket connection with the dashboard
3. Begin processing Discord events and interactions
4. Log activities to console and log files

## Logging

The bot generates several log files:

- `tccbot_trace.log` - Detailed trace logging
- `tccbot_ws.log` - WebSocket communication logs
- `tccbot_http.log` - HTTP request logs

## File Structure

```text
bot/
├── main.c                           # Main bot entry point
├── setup.c                          # Setup and initialization
├── Makefile                         # Build configuration
├── config.json                      # Bot configuration
├── roles.json                       # Role definitions
├── include/
│   └── tccbot.h                     # Main header file
├── src/
│   ├── tccbot_context.c             # Context management
│   ├── tccbot_dashboard.c           # Dashboard communication
│   ├── tccbot_dashboard-events.c    # Event handling
│   └── tccbot_interactions-handler.c # Interaction processing
└── concord/                         # Discord library (submodule)
```

## Development

### Adding New Features

1. Define new interactions in `tccbot_interactions-handler.c`
2. Add dashboard events in `tccbot_dashboard-events.c`
3. Update context structure in `tccbot.h` if needed
4. Rebuild with `make`

## Integration with Dashboard

The bot communicates with the web dashboard through:

- **WebSocket Connection**: Real-time bidirectional communication
- **Event Broadcasting**: Sends Discord events to dashboard
- **Command Reception**: Receives commands from dashboard interface

## Error Handling

- Automatic reconnection for Discord and WebSocket connections
- Exponential backoff for failed connection attempts
- Comprehensive error logging and reporting
- Graceful degradation when dashboard is unavailable

## License

Part of the Educational Discord Bot Bachelor Thesis Project - UFPR
