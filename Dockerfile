FROM denoland/deno:2.3.1

WORKDIR /app

# Copy dependency manifests first for caching
COPY deno.json deno.lock* ./
RUN deno install

# Copy application code
COPY . .

# Build for production (outputs to _fresh/)
RUN deno task build

# Expose port
EXPOSE 8000

# Run production server
CMD ["task", "start"]
