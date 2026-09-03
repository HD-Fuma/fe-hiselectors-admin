export function youtubeEmbedUrl(videoId?: string, startSeconds?: number) {
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
  const params = new URLSearchParams({
    modestbranding: "1",
    rel: "0",
  });
  if (startSeconds != null && startSeconds >= 0) {
    params.set("start", String(Math.floor(startSeconds)));
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
