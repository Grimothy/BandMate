#!/bin/bash

# Version management script for BandMate
# Usage: ./scripts/bump-version.sh [major|minor|patch|VERSION]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the latest tag
get_latest_tag() {
    git fetch --tags 2>/dev/null || true
    LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
    # Remove both 'v' and 'V' prefixes
    VERSION="${LATEST_TAG#v}"
    VERSION="${VERSION#V}"
    echo "$VERSION"
}

# Bump version number
bump_version() {
    local version=$1
    local bump_type=$2
    
    IFS='.' read -r -a parts <<< "$version"
    major=${parts[0]}
    minor=${parts[1]}
    patch=${parts[2]}
    
    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo "Invalid bump type: $bump_type"
            exit 1
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

# Update package.json files
update_packages() {
    local version=$1
    
    echo -e "${YELLOW}Updating backend/package.json...${NC}"
    (cd backend && npm version "$version" --no-git-tag-version --allow-same-version)
    
    echo -e "${YELLOW}Updating frontend/package.json...${NC}"
    (cd frontend && npm version "$version" --no-git-tag-version --allow-same-version)
}

# Main logic
main() {
    cd "$(dirname "$0")/.."
    
    CURRENT_VERSION=$(get_latest_tag)
    echo -e "${GREEN}Current version: $CURRENT_VERSION${NC}"
    
    if [ -z "$1" ]; then
        echo "Usage: $0 [major|minor|patch|VERSION]"
        echo ""
        echo "Examples:"
        echo "  $0 patch       # Bump patch version (1.0.0 -> 1.0.1)"
        echo "  $0 minor       # Bump minor version (1.0.0 -> 1.1.0)"
        echo "  $0 major       # Bump major version (1.0.0 -> 2.0.0)"
        echo "  $0 1.2.3       # Set specific version"
        exit 1
    fi
    
    case $1 in
        major|minor|patch)
            NEW_VERSION=$(bump_version "$CURRENT_VERSION" "$1")
            ;;
        *)
            # Validate version format
            if [[ ! $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                echo -e "${RED}Error: Version must be in format X.Y.Z (e.g., 1.0.0)${NC}"
                exit 1
            fi
            NEW_VERSION=$1
            ;;
    esac
    
    echo -e "${GREEN}New version: $NEW_VERSION${NC}"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    
    # Update package.json files
    update_packages "$NEW_VERSION"
    
    # Commit changes
    echo -e "${YELLOW}Committing changes...${NC}"
    git add backend/package.json backend/package-lock.json frontend/package.json frontend/package-lock.json
    git commit -m "chore: bump version to $NEW_VERSION"
    
    # Create tag
    echo -e "${YELLOW}Creating git tag v$NEW_VERSION...${NC}"
    git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
    
    echo ""
    echo -e "${GREEN}Version bumped to $NEW_VERSION${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review the changes: git log --oneline -3"
    echo "  2. Push to remote: git push origin main --tags"
    echo "  3. Create a release on GitHub (this will trigger Docker build)"
}

main "$@"
