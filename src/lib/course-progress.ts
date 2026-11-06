/** 講座の一覧と視聴済みの一覧から、全体の本数と視聴済みの本数を数える。 */
export function summarizeProgress(
  courseIds: string[],
  completedCourseIds: string[],
) {
  const completed = new Set(completedCourseIds);
  return {
    total: courseIds.length,
    completed: courseIds.filter((courseId) => completed.has(courseId)).length,
  };
}
