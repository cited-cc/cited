import type { Pool, PoolClient, QueryResult } from "pg";

import { mapPgError } from "@/lib/db/errors";
import { assertAllowedRpc, assertAllowedTable } from "@/lib/db/providers/postgres/tables";

type QueryResultShape<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

type Filter =
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "neq"; column: string; value: unknown }
  | { kind: "in"; column: string; value: unknown[] }
  | { kind: "is"; column: string; value: unknown }
  | { kind: "not"; column: string; operator: string; value: unknown }
  | { kind: "gte"; column: string; value: unknown }
  | { kind: "lte"; column: string; value: unknown }
  | { kind: "gt"; column: string; value: unknown }
  | { kind: "lt"; column: string; value: unknown }
  | { kind: "or"; expression: string };

type OrderSpec = { column: string; ascending: boolean };

function assertColumn(column: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
    throw new Error(`Invalid column identifier: ${column}`);
  }
  return column;
}

function pushParam(params: unknown[], value: unknown): string {
  params.push(value);
  return `$${params.length}`;
}

function parseOrExpression(expression: string, params: unknown[]): string {
  const parts = expression.split(",");
  const clauses: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.(ilike|eq|neq)\.(.+)$/);
    if (!match) {
      throw new Error(`Unsupported OR filter expression: ${trimmed}`);
    }
    const column = assertColumn(match[1]);
    const operator = match[2];
    const value = match[3];
    if (value.startsWith("%") || value.endsWith("%")) {
      const placeholder = pushParam(params, value);
      clauses.push(`${column} ILIKE ${placeholder}`);
      continue;
    }
    const placeholder = pushParam(params, value);
    if (operator === "eq") {
      clauses.push(`${column} = ${placeholder}`);
    } else if (operator === "neq") {
      clauses.push(`${column} <> ${placeholder}`);
    } else {
      clauses.push(`${column} ILIKE ${placeholder}`);
    }
  }
  return `(${clauses.join(" OR ")})`;
}

function omitUndefinedValues(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );
}

function returningColumns(columns: string): string {
  if (!columns || columns === "*") {
    return "*";
  }
  return columns
    .split(",")
    .map((column) => assertColumn(column.trim()))
    .join(", ");
}

function buildWhere(filters: Filter[], params: unknown[]): string {
  if (filters.length === 0) {
    return "";
  }
  const clauses: string[] = [];
  for (const filter of filters) {
    switch (filter.kind) {
      case "eq": {
        const column = assertColumn(filter.column);
        if (filter.value === null) {
          clauses.push(`${column} IS NULL`);
        } else {
          clauses.push(`${column} = ${pushParam(params, filter.value)}`);
        }
        break;
      }
      case "neq": {
        const column = assertColumn(filter.column);
        clauses.push(`${column} <> ${pushParam(params, filter.value)}`);
        break;
      }
      case "in": {
        const column = assertColumn(filter.column);
        const values = filter.value as unknown[];
        if (values.length === 0) {
          clauses.push("FALSE");
        } else {
          const placeholders = values.map((value) => pushParam(params, value));
          clauses.push(`${column} IN (${placeholders.join(", ")})`);
        }
        break;
      }
      case "is": {
        const column = assertColumn(filter.column);
        if (filter.value === null) {
          clauses.push(`${column} IS NULL`);
        } else {
          clauses.push(`${column} IS ${pushParam(params, filter.value)}`);
        }
        break;
      }
      case "not": {
        const column = assertColumn(filter.column);
        if (filter.operator === "is" && filter.value === null) {
          clauses.push(`${column} IS NOT NULL`);
        } else {
          clauses.push(
            `NOT (${column} ${filter.operator.toUpperCase()} ${pushParam(params, filter.value)})`,
          );
        }
        break;
      }
      case "gte":
      case "lte":
      case "gt":
      case "lt": {
        const column = assertColumn(filter.column);
        const operator =
          filter.kind === "gte"
            ? ">="
            : filter.kind === "lte"
              ? "<="
              : filter.kind === "gt"
                ? ">"
                : "<";
        clauses.push(`${column} ${operator} ${pushParam(params, filter.value)}`);
        break;
      }
      case "or":
        clauses.push(parseOrExpression(filter.expression, params));
        break;
      default: {
        const neverFilter: never = filter;
        throw new Error(`Unsupported filter: ${String(neverFilter)}`);
      }
    }
  }
  return ` WHERE ${clauses.join(" AND ")}`;
}

class PostgresQueryBuilder<T = Record<string, unknown>> {
  private readonly table: string;
  private readonly executor: QueryExecutor;
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private columns = "*";
  private filters: Filter[] = [];
  private orders: OrderSpec[] = [];
  private limitValue?: number;
  private insertRows: Record<string, unknown>[] = [];
  private updateValues: Record<string, unknown> = {};
  private upsertConflict?: string;
  private countOnly = false;
  private headOnly = false;
  private returning = false;
  private singleRow = false;
  private maybeSingleRow = false;

  constructor(table: string, executor: QueryExecutor) {
    this.table = assertAllowedTable(table);
    this.executor = executor;
  }

  select(
    columns = "*",
    options?: { count?: "exact"; head?: boolean },
  ): this {
    if (
      this.operation === "insert" ||
      this.operation === "update" ||
      this.operation === "delete" ||
      this.operation === "upsert"
    ) {
      this.columns = columns;
      this.returning = true;
      return this;
    }

    this.operation = "select";
    this.columns = columns;
    if (options?.count === "exact") {
      this.countOnly = true;
    }
    if (options?.head === true) {
      this.headOnly = true;
    }
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]): this {
    this.operation = "insert";
    this.insertRows = Array.isArray(values) ? values : [values];
    this.returning = true;
    return this;
  }

  update(values: Record<string, unknown>): this {
    this.operation = "update";
    this.updateValues = values;
    this.returning = true;
    return this;
  }

  delete(): this {
    this.operation = "delete";
    this.returning = true;
    return this;
  }

  upsert(
    values: Record<string, unknown>,
    options?: { onConflict?: string; ignoreDuplicates?: boolean },
  ): this {
    this.operation = "upsert";
    this.insertRows = [values];
    this.upsertConflict = options?.onConflict;
    this.returning = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ kind: "neq", column, value });
    return this;
  }

  in(column: string, value: unknown[]): this {
    this.filters.push({ kind: "in", column, value });
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push({ kind: "is", column, value });
    return this;
  }

  not(column: string, operator: string, value: unknown): this {
    this.filters.push({ kind: "not", column, operator, value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ kind: "gte", column, value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ kind: "lte", column, value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ kind: "gt", column, value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ kind: "lt", column, value });
    return this;
  }

  or(expression: string): this {
    this.filters.push({ kind: "or", expression });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orders.push({ column: assertColumn(column), ascending: options?.ascending ?? true });
    return this;
  }

  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  single(): Promise<QueryResultShape<T>> {
    this.singleRow = true;
    return this.execute() as Promise<QueryResultShape<T>>;
  }

  maybeSingle(): Promise<QueryResultShape<T>> {
    this.maybeSingleRow = true;
    return this.execute() as Promise<QueryResultShape<T>>;
  }

  then<TResult1 = QueryResultShape<T[]>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResultShape<T[]>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return (this.execute() as Promise<QueryResultShape<T[]>>).then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResultShape<T | T[]>> {
    try {
      const params: unknown[] = [];
      let sql = "";

      if (this.operation === "select") {
        if (this.countOnly) {
          sql = `SELECT COUNT(*)::int AS count FROM public.${this.table}${buildWhere(this.filters, params)}`;
        } else {
          const orderSql =
            this.orders.length > 0
              ? ` ORDER BY ${this.orders
                  .map((order) => `${order.column} ${order.ascending ? "ASC" : "DESC"}`)
                  .join(", ")}`
              : "";
          const limitSql =
            this.limitValue !== undefined ? ` LIMIT ${Math.max(0, this.limitValue)}` : "";
          sql = `SELECT ${this.columns} FROM public.${this.table}${buildWhere(this.filters, params)}${orderSql}${limitSql}`;
        }
      } else if (this.operation === "insert") {
        const row = omitUndefinedValues(this.insertRows[0] ?? {});
        const columns = Object.keys(row).map(assertColumn);
        const placeholders = columns.map((column) => pushParam(params, row[column]));
        sql = `INSERT INTO public.${this.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING ${returningColumns(this.columns)}`;
      } else if (this.operation === "update") {
        const setColumns = Object.keys(this.updateValues).map(assertColumn);
        const setSql = setColumns
          .map((column) => `${column} = ${pushParam(params, this.updateValues[column])}`)
          .join(", ");
        sql = `UPDATE public.${this.table} SET ${setSql}${buildWhere(this.filters, params)} RETURNING ${returningColumns(this.columns)}`;
      } else if (this.operation === "delete") {
        sql = `DELETE FROM public.${this.table}${buildWhere(this.filters, params)} RETURNING ${returningColumns(this.columns)}`;
      } else if (this.operation === "upsert") {
        const row = omitUndefinedValues(this.insertRows[0] ?? {});
        const columns = Object.keys(row).map(assertColumn);
        const placeholders = columns.map((column) => pushParam(params, row[column]));
        const conflict = this.upsertConflict
          ? ` ON CONFLICT (${this.upsertConflict
              .split(",")
              .map((part) => assertColumn(part.trim()))
              .join(", ")}) DO UPDATE SET ${columns
              .map((column) => `${column} = EXCLUDED.${column}`)
              .join(", ")}`
          : " ON CONFLICT DO NOTHING";
        sql = `INSERT INTO public.${this.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})${conflict} RETURNING ${returningColumns(this.columns)}`;
      }

      const result = await this.executor.query(sql, params);
      return this.formatResult(result);
    } catch (error) {
      const mapped = mapPgError(error);
      return { data: null, error: { message: mapped.message, code: mapped.code } };
    }
  }

  private formatResult(result: QueryResult): QueryResultShape<T | T[]> {
    if (this.countOnly) {
      const count = Number(result.rows[0]?.count ?? 0);
      if (this.headOnly) {
        return { data: null, error: null, count };
      }
      return { data: result.rows as T[], error: null, count };
    }

    if (this.singleRow) {
      if (result.rows.length !== 1) {
        return {
          data: null,
          error: { message: "Expected exactly one row." },
        };
      }
      return { data: result.rows[0] as T, error: null };
    }

    if (this.maybeSingleRow) {
      if (result.rows.length > 1) {
        return {
          data: null,
          error: { message: "Expected at most one row." },
        };
      }
      return {
        data: (result.rows[0] as T | undefined) ?? null,
        error: null,
      };
    }

    return { data: result.rows as T[], error: null, count: result.rowCount ?? null };
  }
}

type QueryExecutor = {
  query: (sql: string, params?: unknown[]) => Promise<QueryResult>;
};

export class PostgresAdminClient {
  constructor(private readonly executor: QueryExecutor) {}

  from<T = Record<string, unknown>>(table: string): PostgresQueryBuilder<T> {
    return new PostgresQueryBuilder<T>(table, this.executor);
  }

  async rpc<T = unknown>(
    fn: string,
    args: Record<string, unknown> = {},
  ): Promise<QueryResultShape<T>> {
    try {
      const rpcName = assertAllowedRpc(fn);
      const argNames = Object.keys(args);
      const params: unknown[] = Object.values(args);
      const placeholders = argNames.map((_, index) => `$${index + 1}`).join(", ");
      const sql =
        argNames.length > 0
          ? `SELECT * FROM public.${rpcName}(${placeholders})`
          : `SELECT public.${rpcName}() AS result`;
      const result = await this.executor.query(sql, params);
      if (result.rows.length === 1 && "result" in result.rows[0]) {
        return { data: result.rows[0].result as T, error: null };
      }
      return { data: result.rows as T, error: null };
    } catch (error) {
      const mapped = mapPgError(error);
      return { data: null, error: { message: mapped.message, code: mapped.code } };
    }
  }
}

export function createPostgresAdminClient(pool: Pool): PostgresAdminClient {
  return new PostgresAdminClient({
    query: (sql, params) => pool.query(sql, params),
  });
}

export function createPostgresAdminClientFromClient(client: PoolClient): PostgresAdminClient {
  return new PostgresAdminClient({
    query: (sql, params) => client.query(sql, params),
  });
}

export async function withPostgresTransaction<T>(
  pool: Pool,
  callback: (client: PostgresAdminClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(createPostgresAdminClientFromClient(client));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw mapPgError(error);
  } finally {
    client.release();
  }
}
