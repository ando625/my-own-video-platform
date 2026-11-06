import { withAdmin } from "@/lib/api-route";
import { unpublishCourse } from "@/services/course-service";

type CourseRouteContext = {
  params: Promise<{ courseId: string }>;
};

export const POST = withAdmin(
  async (_request, { params }: CourseRouteContext) => {
    const { courseId } = await params;
    return Response.json({ course: await unpublishCourse(courseId) });
  },
);
