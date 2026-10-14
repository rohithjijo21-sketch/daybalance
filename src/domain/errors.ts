import { ZodError } from "zod";
export function errorMessage(error: unknown): string {
  if (error instanceof ZodError)
    return error.issues
      .slice(0, 3)
      .map(
        (issue) =>
          `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}`,
      )
      .join("\n");
  return error instanceof Error ? error.message : String(error);
}
