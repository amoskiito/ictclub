import { useEffect, useState } from "react";
import { PageHead, Loading, Alert, Empty, useFetch, useTitle } from "../components/ui";

export default function Gallery() {
  useTitle("Gallery");
  const { data, loading, error } = useFetch("/content/albums");
  const [album, setAlbum] = useState(null);
  const [light, setLight] = useState(-1);
  const albums = data ? data.items : [];

  useEffect(() => {
    if (light < 0) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setLight(-1);
      if (e.key === "ArrowRight") setLight((i) => (i + 1) % album.images.length);
      if (e.key === "ArrowLeft") setLight((i) => (i - 1 + album.images.length) % album.images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [light, album]);

  if (album) {
    return (
      <div className="container">
        <p className="crumbs"><button className="link-btn" onClick={() => setAlbum(null)}>← All albums</button></p>
        <PageHead title={album.title} sub={album.description} />
        {!album.images.length && <Empty icon="🖼️" title="No photos in this album yet" />}
        <div className="photo-grid">
          {album.images.map((img, i) => (
            <button key={img.url + i} className="photo" onClick={() => setLight(i)} aria-label={`Open photo ${i + 1}${img.caption ? `: ${img.caption}` : ""}`}>
              <img src={img.url} alt={img.caption || `${album.title} photo ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>

        {light >= 0 && (
          <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLight(-1)}>
            <button className="lightbox-close" aria-label="Close" onClick={() => setLight(-1)}>✕</button>
            <img src={album.images[light].url} alt={album.images[light].caption || album.title} onClick={(e) => e.stopPropagation()} />
            {album.images[light].caption && <p>{album.images[light].caption}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <PageHead title="Gallery" sub="Moments from our events." />
      {loading ? <Loading /> : <Alert>{error}</Alert>}
      {data && !albums.length && <Empty icon="📷" title="No albums yet">Photos will be added after the next event.</Empty>}
      <div className="grid-3">
        {albums.map((a) => (
          <button key={a.id} className="card album" onClick={() => setAlbum(a)}>
            {a.images[0]
              ? <img src={a.images[0].url} alt="" loading="lazy" />
              : <div className="album-emoji" aria-hidden="true">{a.coverEmoji || "📷"}</div>}
            <div className="album-info">
              <h3>{a.title}</h3>
              <p className="muted small">{a.images.length} photo{a.images.length === 1 ? "" : "s"}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
