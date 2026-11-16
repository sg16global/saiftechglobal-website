# Build sandbox image for the Saif Tech Global build runner (Node.js 24, no internet at runtime).
FROM node:24-trixie-slim
COPY --from=docker.io/cloudflare/sandbox:1.0.1 /usr/local/bin/sandbox-shim /usr/local/bin/sandbox-shim
RUN mkdir /workspace
CMD ["sleep", "infinity"]
