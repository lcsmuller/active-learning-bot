# TCC Bot - Educational Discord Bot - Implementation

This is a minimal working implementation of the educational Discord bot described in the Bachelor's Thesis "Bot Educacional para Metodologias Ativas em Ambientes Virtuais" by Lucas Müller at UFPR.

## Quick Start

### 1. Start the Dashboard

```bash
cd dashboard
./start.sh
```

Access: <http://localhost:3001>

### 2. Start the Discord Bot

```bash
cd bot
export DISCORD_TOKEN="your_discord_bot_token"
make && ./main
```

## Core Features Implemented

From the thesis requirements, this minimal version implements:

✅ **Dashboard Interface** - Web-based teacher control panel  
✅ **Real-time Communication** - WebSocket bot-dashboard integration  
✅ **Anonymous Questions** - Students can ask questions privately  
✅ **Interactive Polls** - Teacher-created polls with student responses  
✅ **Class Management** - Start/end classes with access codes  
✅ **Discussion Sharing** - Teacher discussion sharing to students  
✅ **Engagement Tracking** - Real-time student participation metrics  

## Architecture

**Dual Architecture** (as per thesis):

- **Dashboard** (Node.js + Express + WebSocket) - Teacher interface
- **Discord Bot** (C + Concord library) - Student interface

**Communication Flow**:

1. Teacher uses dashboard to control class
2. Dashboard sends commands to bot via WebSocket  
3. Bot interacts with students on Discord
4. Bot sends engagement data back to dashboard
5. Teacher sees real-time feedback

## Student Commands (Discord)

- `!ask <question>` - Ask anonymous question to teacher
- `!poll <answer>` - Respond to teacher's poll
- `!help` - Show available commands

## Teacher Interface (Dashboard)

- Start/End class sessions
- Start a discussion on the Discord channel
- Create interactive polls
- Monitor real-time student engagement
- View questions from students

## Technical Implementation

**No Authentication** - Simplified for proof of concept  
**No Database** - In-memory state management  
**WebSocket Communication** - Real-time dashboard-bot integration  
**Dependencies** - Only essential packages  

## Files Structure

```console
dashboard/
├── server.js          # Express server with WebSocket
├── package.json       # Dependencies  
├── public/index.html  # Teacher dashboard interface
└── start.sh           # Startup script

bot/
├── main.c             # Discord bot implementation
├── Makefile           # Compilation configuration  
└── concord/           # Discord library
```

## Thesis Compliance

This implementation directly addresses the thesis concepts:

- **Comunicação multidirecional** ✓ Bot mediates teacher-student interaction
- **Engajamento ativo** ✓ Anonymous questions & polls encourage participation  
- **Adaptação contextual** ✓ Teachers control flow via dashboard
- **Integração não-invasiva** ✓ Simple commands don't disrupt class
- **Separação de canais** ✓ Dashboard (command) vs Discord (interaction)

## License

MIT License - Lucas Müller, UFPR 2024
