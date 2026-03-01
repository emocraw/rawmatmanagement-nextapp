# 1️⃣ Base Image
FROM node:20-alpine AS base

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package files
COPY package.json package-lock.json ./

# 4️⃣ Install dependencies
RUN npm install

# 5️⃣ Copy project files
COPY . .

# 6️⃣ Build Next.js
RUN npm run build

# 7️⃣ Production image
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app ./

EXPOSE 3000

CMD ["npm", "start"]