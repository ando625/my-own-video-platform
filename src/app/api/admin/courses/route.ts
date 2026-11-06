import { readJsonBody, withAdmin } from "@/lib/api-route";
import { createCourse, listCourses } from "@/services/course-service";

export const GET = withAdmin(async () => {
  return Response.json({ courses: await listCourses() });
});

export const POST = withAdmin(async (request) => {
  const course = await createCourse(await readJsonBody(request));
  return Response.json({ course }, { status: 201 });
});
