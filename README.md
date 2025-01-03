# Spheron Agent Platform

A platform for creating, managing, and interacting with AI-powered game characters and agents.

## Project Structure

- `character-dashboard/` - Frontend React application for character management and interaction
- `character-creator/` - Backend server for character creation and management
- `contracts/` - Smart contracts for the platform
- `gentic-contracts/` - Genetic algorithm-based smart contracts
- `swap-component/` - Token swap functionality
- `ai-brain/` - AI processing and logic components

## Frontend (character-dashboard)

The frontend is built with React and TypeScript, providing a modern and interactive user interface.

### Key Features:
- Character creation and customization
- Game character interaction interface
- Real-time chat with AI characters
- Character dashboard for management
- Token swap functionality
- Game-specific interfaces

### Main Components:
- Character Creation UI
- Chat Interface
- Game Interface
- Character Management Dashboard
- Token Swap Widget
- Navigation System

## Backend (character-creator)

The backend server handles character creation, management, and AI interactions.

### Features:
- Character generation and management
- Game agent prompt handling
- API routes for character interactions
- Data persistence
- AI integration

## Smart Contracts

The platform includes several smart contract components:

- Token Contract: Handles platform token functionality
- AgentLaunchPad: Manages character deployment and initialization
- Genetic Contracts: Implements genetic algorithms for character evolution

## Getting Started

### Frontend Setup
1. Navigate to the character-dashboard directory:
```bash
cd character-dashboard
npm install
npm run dev
```

### Backend Setup
1. Navigate to the character-creator directory:
```bash
cd character-creator
npm install
npm start
```

### Smart Contract Deployment
1. Navigate to the contracts directory:
```bash
cd contracts
# Follow contract deployment instructions
```

## Technology Stack

- Frontend: React, TypeScript, Next.js
- Backend: Node.js, Express
- Smart Contracts: Solidity
- AI Integration: Custom AI models and prompts
- Storage: Database systems (specify your database)



```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```