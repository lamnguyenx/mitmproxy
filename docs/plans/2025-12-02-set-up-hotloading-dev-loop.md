# Set Up Hotloading Dev Loop Implementation Plan

## Overview

Optimize the Docker-based development environment for mitmproxy to enable efficient hotloading during the dev loop: change code -> manual container restart -> check logs -> repeat. **All dependencies must be installed during Docker image build - no installations permitted at container runtime.** This involves removing unnecessary overhead from Dockerfile and docker-compose.yml while maintaining functionality.

## Current State Analysis

The original setup used Docker for development with volumes mounted for code changes, but included redundant elements that slowed startup and rebuilds:
- Prebuilt image reference in docker-compose.yml
- Healthcheck with curl polling every 30s
- Unnecessary curl dependency in base image
- Unclear comments on build steps

## Desired End State

A streamlined Docker setup that:
- Builds fresh images without stale prebuilt references
- Starts containers quickly without healthcheck delays
- Supports the dev loop with manual restarts for hotloading
- Has clear documentation of build steps
- Follows Dockerfile formatting best practices
- **Installs all dependencies (Python packages, Node.js modules) during build, not runtime**
- **Strategically mounts volumes to avoid overriding installed packages (venv, node_modules)**

### Key Discoveries:
- Manual container restarts are acceptable for hotloading (no complex file watchers needed)
- uv sync installs dependencies; uv pip install -e . ensures editable local package
- Volumes already enable code changes without rebuilds

## What We're NOT Doing

- Implementing automatic hot reloading (e.g., nodemon, file watchers)
- Changing the core mitmproxy architecture
- Adding dev-specific tools beyond what's needed
- Modifying runtime behavior of mitmweb

## Implementation Approach

Remove overhead elements, add clarifying comments, and reformat per Dockerfile best practices. Focus on incremental changes that maintain existing functionality while improving dev experience.

## Phase 1: Optimize Docker Configuration

### Overview
Remove unnecessary elements from docker-compose.yml and Dockerfile, add explanatory comments, and reformat for readability.

### Changes Required:

#### 1. docker-compose.yml Optimizations
**File**: `docker-compose.yml`
**Changes**:
- Remove `image` line to ensure fresh builds
- Remove `healthcheck` block to eliminate 30s startup delays
- **Strategic volume mounting**: Mount source directories while excluding installed packages (e.g., `/app/__pycache__`, `/app/.pytest_cache`, `/app/web/node_modules`) to prevent overriding container-installed dependencies with empty host directories

#### 2. Dockerfile Optimizations
**File**: `Dockerfile`
**Changes**:
- Remove `curl` from conda install (only needed for removed healthcheck)
- Add comments explaining uv sync and uv pip install -e . commands
- Reformat with proper indentation after WORKDIR and blank lines for grouping
- **Build-time dependency installation**: All Python packages (via uv) and Node.js modules (via npm) are installed during image build, ensuring container starts with all dependencies ready

### Success Criteria:

#### Automated Verification:
- [ ] Docker build succeeds: `docker-compose build`
- [ ] Container starts without errors: `docker-compose up -d`
- [ ] Health check removed (no curl polling): verify logs show no healthcheck messages
- [ ] Dependencies installed correctly: check uv.lock matches installed versions
- [ ] No runtime installations: container logs show no pip/npm install commands during startup

#### Manual Verification:
- [ ] Dev loop works: change code in mitmproxy/, restart container, changes reflected
- [ ] Web interface loads at http://localhost:8011
- [ ] Logs accessible for debugging
- [ ] No performance regression in startup time

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the dev loop works smoothly before considering the setup complete.

---

## Testing Strategy

### Unit Tests:
- Verify Docker build completes without errors
- Check that all required dependencies are installed

### Integration Tests:
- Container startup and mitmweb service availability
- Volume mounting functionality

### Manual Testing Steps:
1. Start container: `docker-compose up`
2. Verify mitmweb accessible at localhost:8011
3. Make code change in mounted directory
4. Restart container manually
5. Confirm changes loaded without full rebuild

## Performance Considerations

- Removed healthcheck reduces startup time by ~30s
- Removed curl from base image reduces image size slightly
- Fresh builds ensure no stale cached layers

## Migration Notes

No migration needed - changes are backward compatible. Existing containers can be stopped/removed and rebuilt with optimized config.

## References

- Dockerfile formatting guide: Internal best practices
- uv documentation: https://docs.astral.sh/uv/
- Docker caching: https://docs.docker.com/develop/dev-best-practices/