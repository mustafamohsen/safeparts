#!/bin/bash
# Docker image testing script for Safeparts Web UI
# Run this after building the image to verify functionality

set -e

IMAGE_NAME="${1:-safeparts-web:latest}"
PORT="${2:-8080}"

echo "Testing Docker image: $IMAGE_NAME"
echo "========================================="

# Test 1: Build the image
echo "Test 1/5: Building Docker image..."
docker build -t "$IMAGE_NAME" -f web/Dockerfile .
echo "✓ Build successful"

# Test 2: Start container
echo ""
echo "Test 2/5: Starting container on port $PORT..."
CONTAINER_ID=$(docker run -d -p "$PORT:80" "$IMAGE_NAME")
echo "Container started: $CONTAINER_ID"

# Wait for container to be ready
sleep 5

# Test 3: Check web UI loads
echo ""
echo "Test 3/5: Testing web UI at http://localhost:$PORT/..."
if curl -f -s "http://localhost:$PORT/" > /dev/null; then
    echo "✓ Web UI loads successfully"
else
    echo "✗ Web UI failed to load"
    docker logs "$CONTAINER_ID"
    docker stop "$CONTAINER_ID" && docker rm "$CONTAINER_ID"
    exit 1
fi

# Test 4: Check docs site loads
echo ""
echo "Test 4/5: Testing docs at http://localhost:$PORT/help/..."
if curl -f -s "http://localhost:$PORT/help/" > /dev/null; then
    echo "✓ Documentation site loads successfully"
else
    echo "✗ Documentation site failed to load"
    docker logs "$CONTAINER_ID"
    docker stop "$CONTAINER_ID" && docker rm "$CONTAINER_ID"
    exit 1
fi

# Test 5: Check image size
echo ""
echo "Test 5/5: Checking image size..."
IMAGE_SIZE=$(docker images "$IMAGE_NAME" --format "{{.Size}}")
echo "Image size: $IMAGE_SIZE"

# Extract numeric size (this is approximate, adjust as needed)
SIZE_MB=$(docker images "$IMAGE_NAME" --format "{{.Size}}" | grep -oE '[0-9]+' | head -1)
if [ "$SIZE_MB" -lt 100 ]; then
    echo "✓ Image size is reasonable (< 100MB)"
else
    echo "⚠ Image size is larger than expected (target: < 50MB)"
fi

# Cleanup
echo ""
echo "Cleaning up..."
docker stop "$CONTAINER_ID" && docker rm "$CONTAINER_ID"

echo ""
echo "========================================="
echo "All tests passed! ✓"
echo ""
echo "To manually test:"
echo "  docker run -p 8080:80 $IMAGE_NAME"
echo "  Open http://localhost:8080"
echo "  Open http://localhost:8080/help"
