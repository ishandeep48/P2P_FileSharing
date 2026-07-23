.PHONY: test build dev lint clean

# Run all tests in P2P-sharing
test:
	cd P2P-sharing && npm run test

# Run tests in watch mode
test:watch:
	cd P2P-sharing && npm run test:watch

# Build the project
build:
	cd P2P-sharing && npm run build

# Start development server
dev:
	cd P2P-sharing && npm run dev

# Lint the code
lint:
	cd P2P-sharing && npm run lint

# Clean node_modules and dist
clean:
	rm -rf P2P-sharing/node_modules
	rm -rf P2P-sharing/dist
