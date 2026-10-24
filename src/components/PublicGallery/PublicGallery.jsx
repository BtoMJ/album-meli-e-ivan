import { useEffect, useState } from "react";
import { supabase } from "../../conexion/supabase";

import "./PublicGallery.css";

const getVisitorId = () => {
  let visitorId = localStorage.getItem("album_visitor_id");

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("album_visitor_id", visitorId);
  }

  return visitorId;
};

function PublicGallery({ evento }) {
  const [photos, setPhotos] = useState([]);
  const [photoSelected, setPhotoSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likes, setLikes] = useState({});

  const toggleLike = async (fotoId) => {
    const visitorId = getVisitorId();

    const currentLike = likes[fotoId];

    if (currentLike?.liked) {
      const { error } = await supabase
        .from("foto_likes")
        .delete()
        .eq("foto_id", fotoId)
        .eq("visitor_id", visitorId);

      if (error) {
        console.error(error);
        return;
      }

      setLikes((currentLikes) => ({
        ...currentLikes,
        [fotoId]: {
          count: Math.max((currentLikes[fotoId]?.count || 1) - 1, 0),
          liked: false,
        },
      }));

      return;
    }

    const { error } = await supabase.from("foto_likes").insert({
      foto_id: fotoId,
      visitor_id: visitorId,
    });

    if (error) {
      console.error(error);
      return;
    }

    setLikes((currentLikes) => ({
      ...currentLikes,
      [fotoId]: {
        count: (currentLikes[fotoId]?.count || 0) + 1,
        liked: true,
      },
    }));
  };

  useEffect(() => {
    const getPhotos = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("fotos")
        .select("id, storage_path, name_original, guest, note, created_at")
        .eq("event_id", evento.id)
        .eq("state", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("No se pudieron cargar las fotografías.");
        setLoading(false);
        return;
      }

      const photosWithUrl = [];

      for (const photo of data) {
        const { data: file, error: errorFile } = await supabase.storage
          .from("photos")
          .createSignedUrl(photo.storage_path, 3600);

        if (errorFile) {
          console.error(errorFile);
          continue;
        }

        photosWithUrl.push({
          ...photo,
          url: file.signedUrl,
        });
      }

      setPhotos(photosWithUrl);

      const { data: likesData, error: likesError } = await supabase
        .from("foto_likes")
        .select("foto_id, visitor_id")
        .in(
          "foto_id",
          photosWithUrl.map((photo) => photo.id),
        );

      if (likesError) {
        console.error(likesError);
      } else {
        const likesMap = {};

        for (const like of likesData) {
          if (!likesMap[like.foto_id]) {
            likesMap[like.foto_id] = {
              count: 0,
              liked: false,
            };
          }

          likesMap[like.foto_id].count++;

          if (like.visitor_id === getVisitorId()) {
            likesMap[like.foto_id].liked = true;
          }
        }

        setLikes(likesMap);
      }

      setLoading(false);
    };

    getPhotos();
  }, [evento.id]);

  useEffect(() => {
    if (!photoSelected) return;

    const closeEscape = (event) => {
      if (event.key === "Escape") {
        setPhotoSelected(null);
      }
    };

    document.addEventListener("keydown", closeEscape);

    return () => {
      document.removeEventListener("keydown", closeEscape);
    };
  }, [photoSelected]);

  if (loading) {
    return <p className="subtitle">Cargando galería...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <section className="public-gallery-container ">
      {photos.length === 0 ? (
        <p className="no-photos">Aún no hay fotografías para compartir.</p>
      ) : (
        <div className="photo-grid">
          {photos.map((foto) => (
            <button
              key={foto.id}
              type="button"
              onClick={() => setPhotoSelected(foto)}
              aria-label="Ver fotografía ampliada"
              className="photo-item-container"
            >
              <img
                className="photo-item"
                key={foto.id}
                src={foto.url}
                alt={foto.name_original || "Foto de la boda"}
                loading="lazy"
              />
              <div className="photo-title">
                <span>{foto.guest}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {photoSelected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fotografía ampliada"
          onClick={() => setPhotoSelected(null)}
          className="photo-modal"
        >
          <button
            type="button"
            onClick={() => setPhotoSelected(null)}
            aria-label="Cerrar fotografía"
            className="close-button"
          >
            ×
          </button>

          <div
            onClick={(event) => event.stopPropagation()}
            className="info-photo-max center"
          >
            <div className="photo-modal-max">
              <img
                src={photoSelected.url}
                alt="Fotografía ampliada de la boda"
                className="img-modal-max"
              />
              <div className="like-container center">
                <button
                  type="button"
                  onClick={() => toggleLike(photoSelected.id)}
                  aria-label={
                    likes[photoSelected.id]?.liked ? "Quitar like" : "Dar like"
                  }
                >
                  {likes[photoSelected.id]?.liked ? "❤️" : "🤍"}
                </button>
              </div>
              <span className="likes-count">
                {likes[photoSelected.id]?.count || 0}
              </span>
            </div>
            <div className="data-img center">
              {photoSelected.guest && (
                <p className="upload-for">
                  <strong>{photoSelected.guest}</strong>
                </p>
              )}
              {photoSelected.note && (
                <p className="note-photo">{photoSelected.note}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PublicGallery;
