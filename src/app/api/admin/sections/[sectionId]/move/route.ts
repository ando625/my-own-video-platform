import { readJsonBody, withAdmin } from "@/lib/admin-route";
import { moveSection } from "@/services/curriculum-service";

type SectionRouteContext = {
  params: Promise<{ sectionId: string }>;
};

export const POST = withAdmin(
  async (request, { params }: SectionRouteContext) => {
    const { sectionId } = await params;
    await moveSection(sectionId, await readJsonBody(request));
    return Response.json({ success: true });
  },
);
