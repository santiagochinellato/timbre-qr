FROM node:18-bullseye-slim

# 1. Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# 2. Work directory
WORKDIR /app

# 3. Dependencies
COPY package.json ./
RUN npm install --production

# 4. Source code
COPY index.js .

# 5. Environment
ENV PORT=8080
EXPOSE 8080

# 6. Start command
CMD ["npm", "start"]
