# Educational Discord Bot - Bachelor Thesis Project

This repository contains the complete implementation and documentation for an Educational Discord Bot system developed as part of a Bachelor Thesis at UFPR (Universidade Federal do Paraná).

## Project Overview

The project consists of an educational Discord bot that facilitates remote learning interactions, complete with a web-based dashboard for monitoring and management. The system is designed to enhance online educational experiences through interactive Discord-based tools.

## Repository Structure

### 📤 [`bot/`](./bot/)

Contains the main Discord bot implementation written in C using the Concord Discord library. This is the core component that handles Discord interactions, processes educational commands, and communicates with the dashboard.

- **Language**: C
- **Key Features**: Discord API integration, educational interaction handling, WebSocket communication with dashboard
- **Main Files**: `main.c`, `tccbot.h`, various source modules

### 🌐 [`dashboard/`](./dashboard/)

Web-based dashboard for monitoring and managing the educational bot. Built with Node.js and Express, providing real-time insights into bot activities and educational interactions.

- **Language**: JavaScript (Node.js)
- **Key Features**: Real-time monitoring, WebSocket communication, web interface
- **Framework**: Express.js with WebSocket support

### 📊 [`slides-latex/`](./slides-latex/)

LaTeX source files for presentation slides related to the thesis project. Contains the academic presentation materials with UFPR branding.

- **Format**: LaTeX/Beamer
- **Content**: Project presentation, methodology, results
- **Output**: PDF slides for thesis defense

### 📖 [`thesis-latex/`](./thesis-latex/)

Complete LaTeX source code for the bachelor thesis document. Includes all chapters, references, and academic formatting following UFPR standards.

- **Format**: LaTeX
- **Structure**: Multi-chapter thesis with appendices
- **Content**: Literature review, methodology, implementation, validation, conclusions

## Quick Start

1. **Bot Setup**: Navigate to `bot/` directory and follow the setup instructions
2. **Dashboard**: Go to `dashboard/` directory to run the web interface
3. **Documentation**: Thesis and slides can be compiled from their respective LaTeX directories

## Requirements

- **Bot**: GCC compiler, libcurl, Concord Discord library
- **Dashboard**: Node.js, npm
- **Documentation**: LaTeX distribution (TeXLive recommended)

## Academic Context

This project was developed as part of the Computer Science undergraduate program at UFPR, focusing on the application of Discord bots in educational environments and remote learning scenarios.

## Author

Lucas Müller - Computer Science Student, UFPR

## License

This project is part of an academic thesis. Please refer to individual directories for specific licensing information.
