/**
 * Prisma Configuration
 * 
 * This file configures Prisma to use multi-file schema support.
 * All .prisma files in the prisma/schema/ directory will be loaded.
 */

import { config } from 'dotenv';

// Load environment variables from .env file
config();

export default {
  schema: './prisma/schema',
};
