const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

require('dotenv').config({ override: true });

function getConnectionString() {
	const connectionString = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('Falta configurar NEON_DATABASE_URL o DATABASE_URL');
	}

	const url = new URL(connectionString);

	if (url.protocol === 'prisma+postgres:') {
		const apiKey = url.searchParams.get('api_key');

		if (!apiKey) {
			throw new Error('DATABASE_URL usa prisma+postgres pero no incluye api_key');
		}

		const config = JSON.parse(Buffer.from(apiKey, 'base64url').toString('utf8'));

		if (!config.databaseUrl) {
			throw new Error('DATABASE_URL usa prisma+postgres pero no contiene databaseUrl');
		}

		return config.databaseUrl;
	}

	if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
		throw new Error('DATABASE_URL debe usar postgres:// o postgresql://');
	}

	return connectionString;
}

const pool = new Pool({
	connectionString: getConnectionString(),
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
});

module.exports = prisma;
