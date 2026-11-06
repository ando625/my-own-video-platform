import { readJsonBody, withAdmin } from "@/lib/admin-route";
import { moveLesson } from "@/services/curriculum-service";

type LessonRouteContext = {
  params: Promise<{ lessonId: string }>;
};

export const POST = withAdmin(
  async (request, { params }: LessonRouteContext) => {
    const { lessonId } = await params;
    await moveLesson(lessonId, await readJsonBody(request));
    return Response.json({ success: true });
  },
);
