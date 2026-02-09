#!/bin/bash

# BandMate Development Script
# Starts both backend and frontend with hot reloading

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting BandMate Development Servers${NC}"
echo ""

# Check if Docker container is running and warn
if docker ps --format '{{.Names}}' | grep -q '^bandmate$'; then
    echo -e "${YELLOW}Warning: Docker 'bandmate' container is running!${NC}"
    echo -e "${YELLOW}This may cause database conflicts. Stop it with: docker-compose down${NC}"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    (cd backend && npm install)
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    (cd frontend && npm install)
fi

# Generate Prisma client if needed
if [ ! -d "backend/node_modules/.prisma" ]; then
    echo -e "${YELLOW}Generating Prisma client...${NC}"
    (cd backend && npm run db:generate)
fi

echo ""
echo -e "${GREEN}Starting servers...${NC}"
echo -e "  Backend:  http://localhost:3000"
echo -e "  Frontend: http://localhost:5173 ${GREEN}(open this one)${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Start both servers concurrently
# Using & to background and wait to handle Ctrl+C properly
cd backend && npm run dev &
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

# Handle Ctrl+C - kill both processes
trap "echo ''; echo -e '${RED}Stopping servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for both processes
wait
