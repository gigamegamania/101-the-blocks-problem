# technical-test

Vitr.ai developer technical test

## Your mission

- Read this README.md (that's why it's named this way!)
- Ensure the app runs correctly.
- Ensure you have a proper environment to read and write code as well as run tests.
- We ask you to familiarize yourself with the code.
- No more than 30 minutes should be spent before the video interview.

## Project Structure

This repository contains a full-stack application with:

- **Backend**: Express.js API
- **Frontend**: Vue3 application with a textbox that calls the backend
- **Docker Compose**: Configuration to run both apps with hot reload

The app creates a simple web interface to solve the Blocks problem explained in [this file](./spec.md).

## Prerequisites

- Docker and Docker Compose
- An IDE of your choice (e.g., VS Code)
- NodeJS 22 to run tests.
  - Using Volta or nvm is recommended to manage Node versions!
- A UNIX based system. (Linux, MacOS, WSL2 on Windows)
  - Required for functional volume mounts in the containers.

## Getting Started

### Running with Docker Compose

1. Start both applications:

```bash
docker compose up -d
```

2. Access the applications:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5170

3. Run tests

```bash
cd ./backend && npm test
cd ../frontend && npm run test:unit
```
