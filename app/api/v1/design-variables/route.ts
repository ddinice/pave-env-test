import { z } from "zod";

import { currentUser } from "../../../../lib/auth/current-user";
import { apiError, apiJson } from "../../../../lib/api/response";
import { listDesignVariables } from "../../../../lib/design-variables/repository";

const searchParametersSchema = z.object({
  query: z.string().trim().min(1).max(120).optional(),
  subsystem: z.string().trim().min(1).max(120).optional(),
});

export const dynamic = "force-dynamic";

function methodNotAllowed(_request: Request) {
  return apiError("Method Not Allowed", 405, { Allow: "GET" });
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return apiError("Unauthorized", 401);

    const url = new URL(request.url);
    const parameters = searchParametersSchema.safeParse({
      query: url.searchParams.get("query") ?? undefined,
      subsystem: url.searchParams.get("subsystem") ?? undefined,
    });

    if (!parameters.success) return apiError("Invalid query parameters", 400);

    const variables = await listDesignVariables(parameters.data);
    const data = variables.map((variable) => ({
      externalKey: variable.externalKey,
      name: variable.name,
      value: variable.value,
      unit: variable.unit,
      subsystem: variable.subsystem,
      description: variable.description,
      isProtected: variable.isProtected,
      updatedAt: variable.updatedAt.toISOString(),
    }));

    return apiJson({ data, meta: { count: data.length } });
  } catch (error) {
    console.error("GET /api/v1/design-variables failed", error);
    return apiError("Internal Server Error", 500);
  }
}

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const HEAD = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
