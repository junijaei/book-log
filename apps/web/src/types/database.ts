/**
 * Database Types — re-exported from @book-log/database (SSOT)
 *
 * All consumers in apps/web should import from '@/types' or '@/types/database'.
 * The actual definitions live in packages/database/database.ts.
 */

export type {
  Database,
  Tables,
  TablesInsert as InsertTables,
  TablesUpdate as UpdateTables,
  Enums,
  Json,
} from '@book-log/database';
