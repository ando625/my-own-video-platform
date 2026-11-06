import { readJsonBody, withAdmin } from "@/lib/admin-route";
import { createSection } from "@/services/curriculum-service";

type CourseRouteContext = {
  params: Promise<{ courseId: string }>;
};

export const POST = withAdmin(
  async (request, { params }: CourseRouteContext) => {
    const { courseId } = await params;
    const section = await createSection(courseId, await readJsonBody(request));
    return Response.json({ section }, { status: 201 });
  },
);
