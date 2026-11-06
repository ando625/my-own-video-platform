import { readJsonBody, withAdmin } from "@/lib/admin-route";
import { deleteSection, updateSection } from "@/services/curriculum-service";

type SectionRouteContext = {
  params: Promise<{ sectionId: string }>;
};

export const PATCH = withAdmin(
  async (request, { params }: SectionRouteContext) => {
    const { sectionId } = await params;
    const section = await updateSection(sectionId, await readJsonBody(request));
    return Response.json({ section });
  },
);

export const DELETE = withAdmin(
  async (_request, { params }: SectionRouteContext) => {
    const { sectionId } = await params;
    await deleteSection(sectionId);
    return Response.json({ success: true });
  },
);
