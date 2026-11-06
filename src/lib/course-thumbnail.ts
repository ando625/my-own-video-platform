const THUMBNAIL_FILE_NAME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|webp)$/i;

/** public/thumbnails/ に置く画像のファイル名として使えるかを確認する。 */
export function isValidThumbnailFileName(fileName: string): boolean {
  return THUMBNAIL_FILE_NAME_PATTERN.test(fileName);
}

export function getThumbnailPath(fileName: string): string {
  return `/thumbnails/${fileName}`;
}

/** 指定された画像、なければYouTubeの動画の画像を表示先にする。 */
export function getCourseThumbnailSrc({
  thumbnailFileName,
  youtubeVideoId,
}: {
  thumbnailFileName: string | null;
  youtubeVideoId: string;
}): string {
  return thumbnailFileName
    ? getThumbnailPath(thumbnailFileName)
    : `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
}
