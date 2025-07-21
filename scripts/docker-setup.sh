#!/bin/bash

# ReadZone Docker Setup Script
# This script helps set up and manage the ReadZone application using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are installed"
}

# Create environment file if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        
        # Generate random JWT secret
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" .env
        rm .env.bak
        
        print_warning "Please edit .env file and configure your API keys and passwords"
        print_status "Generated random JWT secret"
    else
        print_success ".env file already exists"
    fi
}

# Build and start services
start_production() {
    print_status "Starting ReadZone in production mode..."
    
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service health
    check_health
    
    print_success "ReadZone is running in production mode"
    print_status "Frontend: http://localhost:8080"
    print_status "Backend API: http://localhost:3001"
}

# Start development environment
start_development() {
    print_status "Starting ReadZone in development mode..."
    
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml build --no-cache
    docker-compose -f docker-compose.dev.yml up -d
    
    print_status "Waiting for services to start..."
    sleep 30
    
    print_success "ReadZone is running in development mode"
    print_status "Frontend: http://localhost:5173 (with hot reload)"
    print_status "Backend API: http://localhost:3001 (with hot reload)"
    print_status "Database: localhost:5432"
    print_status "Redis: localhost:6379"
}

# Stop all services
stop_services() {
    print_status "Stopping all ReadZone services..."
    
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    
    print_success "All services stopped"
}

# Check service health
check_health() {
    print_status "Checking service health..."
    
    # Check backend health
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check frontend health
    if curl -s http://localhost:8080/health > /dev/null; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
}

# View logs
view_logs() {
    service=${1:-""}
    
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        docker-compose logs -f
    else
        print_status "Showing logs for $service..."
        docker-compose logs -f "$service"
    fi
}

# Clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose down --volumes --remove-orphans
    docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    print_success "Cleanup completed"
}

# Database operations
db_migrate() {
    print_status "Running database migrations..."
    docker-compose exec backend npx prisma migrate deploy
    print_success "Database migrations completed"
}

db_seed() {
    print_status "Seeding database..."
    docker-compose exec backend npm run seed
    print_success "Database seeding completed"
}

db_reset() {
    print_warning "This will reset the database and delete all data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        docker-compose exec backend npx prisma migrate reset --force
        print_success "Database reset completed"
    else
        print_status "Database reset cancelled"
    fi
}

# Show usage information
show_usage() {
    cat << EOF
ReadZone Docker Management Script

Usage: $0 [COMMAND]

Commands:
    start           Start production environment
    dev             Start development environment  
    stop            Stop all services
    restart         Restart services
    logs [service]  View logs (optionally for specific service)
    health          Check service health
    cleanup         Clean up Docker resources
    
Database Commands:
    db:migrate      Run database migrations
    db:seed         Seed database with sample data
    db:reset        Reset database (WARNING: deletes all data)
    
Setup Commands:
    setup           Initial setup (create .env, etc.)
    
Examples:
    $0 start                # Start production environment
    $0 dev                  # Start development environment
    $0 logs backend         # View backend logs
    $0 db:migrate           # Run database migrations

EOF
}

# Main script logic
main() {
    case ${1:-""} in
        "start")
            check_docker
            setup_env
            start_production
            ;;
        "dev")
            check_docker
            setup_env
            start_development
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 5
            start_production
            ;;
        "logs")
            view_logs "$2"
            ;;
        "health")
            check_health
            ;;
        "cleanup")
            cleanup
            ;;
        "db:migrate")
            db_migrate
            ;;
        "db:seed")
            db_seed
            ;;
        "db:reset")
            db_reset
            ;;
        "setup")
            check_docker
            setup_env
            print_success "Setup completed. You can now run '$0 start' or '$0 dev'"
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: ${1:-""}"
            echo
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"