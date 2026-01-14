FROM node:20-slim

# 1. Install FFmpeg at OS level (Stable & supports RTSP libraries)
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

# 5. Dynamic Port (Railway/Fly support)
EXPOSE 8080

# 6. Start command
CMD ["node", "index.js"]
