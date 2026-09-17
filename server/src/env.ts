import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Must be imported before any other local module, since ESM evaluates all
// static imports before the importing file's own body runs — a plain
// `dotenv.config()` call in index.ts would execute too late for modules
// that read process.env at their own top level (e.g. supabaseUserClient.ts).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
