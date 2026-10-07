import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { newWorkspace, type Workspace } from "@/core/workspace";
import { WorkspaceSchema } from "@/lib/workspaceSchema";

/**
 * The server-side validator strips keys it does not know, so a field added to `Workspace` and
 * forgotten here is silently dropped on its way to /api/compose and /api/checkout/intent. This has
 * happened more than once. The two assignments below are checked by `npm run typecheck`: they stop
 * compiling the moment the model and the schema disagree about a field's presence or shape.
 */
type Parsed = z.infer<typeof WorkspaceSchema>;

describe("WorkspaceSchema stays in step with Workspace", () => {
  it("a Workspace is a valid parsed workspace, and the reverse (compile-time)", () => {
    const toSchema = (w: Workspace): Parsed => w;
    const fromSchema = (p: Parsed): Workspace => p;
    expect(typeof toSchema).toBe("function");
    expect(typeof fromSchema).toBe("function");
  });

  it("a new workspace survives the schema with every key intact (runtime)", () => {
    const w = newWorkspace();
    const out = WorkspaceSchema.parse(w);
    for (const key of Object.keys(w)) expect(out).toHaveProperty(key);
  });
});
