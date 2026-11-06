import { readJsonBody, withAdmin } from "@/lib/admin-route";
import { createLesson } from "@/services/curriculum-service";

type SectionRouteContext = {
  params: Promise<{ sectionId: string }>;
};

export const POST = withAdmin(
  async (request, { params }: SectionRouteContext) => {
    const { sectionId } = await params;
    const lesson = await createLesson(sectionId, await readJsonBody(request));
    return Response.json({ lesson }, { status: 201 });
  },
);
