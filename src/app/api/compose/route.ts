import { NextRequest, NextResponse } from "next/server";
import { composePoa, critiquePoa, renderPoaText } from "@/core";
import type { CaseFileData } from "@/core";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();

  if (supabaseAdmin && email) {
    const { data: license } = await supabaseAdmin
      .from("licenses")
      .select("status")
      .eq("email", email)
      .maybeSingle();
    if (!license || license.status !== "active") {
      return NextResponse.json({ error: "Active Appeal Pass required." }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = (body as { caseData?: unknown })?.caseData as CaseFileData | undefined;
  const attemptNumber = ((body as { attemptNumber?: unknown })?.attemptNumber as number) ?? 1;

  if (!data || !data.kind) {
    return NextResponse.json({ error: "Field 'caseData.kind' is required." }, { status: 400 });
  }

  const draft = composePoa(data, attemptNumber);
  const critique = critiquePoa(draft, data);

  return NextResponse.json({
    draft: {
      docType: draft.docType,
      mode: draft.mode,
      sections: draft.sections,
      watermark: draft.watermark,
      metadata: draft.metadata,
    },
    critique,
    rendered: renderPoaText(draft),
  });
}
