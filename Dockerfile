FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock tsconfig.json prisma.config.ts ./
RUN bun install

COPY prisma ./prisma
RUN bunx prisma generate

COPY src ./src

EXPOSE 8080

CMD ["bun", "run", "dev"]
