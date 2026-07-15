import { QueryClient } from "./transfer.service";

export interface AuditInput {
  userId?: string;
  action: string;
  category: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export default class AuditService {
  static async log(
    client: QueryClient,
    data: AuditInput
  ): Promise<boolean> {
    try {
      await client.query(
        `
        INSERT INTO audit_logs (
          user_id,
          action,
          category,
          description,
          metadata,
          ip_address
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          data.userId ?? null,
          data.action,
          data.category,
          data.description ?? "",
          data.metadata ?? {},
          data.ipAddress ?? null,
        ]
      );

      return true;
    } catch (error) {
      console.error("Audit Log Error:", error);
      return false;
    }
  }
}

import pool from "../../database/connection";

export async function createAuditLog(
  data: AuditInput
): Promise<boolean> {
  try {
    await pool.query(
      `
      INSERT INTO audit_logs (
        user_id,
        action,
        category,
        description,
        metadata,
        ip_address
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        data.userId ?? null,
        data.action,
        data.category,
        data.description ?? "",
        data.metadata ?? {},
        data.ipAddress ?? null,
      ]
    );

    return true;
  } catch (error) {
    console.error("Audit Log Error:", error);
    return false;
  }
}