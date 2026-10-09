import { useEffect, useState } from "react";
import { supabase } from "../../conexion/supabase";

function PublicGallery({ evento }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getPhotos = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("fotos")
        .select("id, storage_path, name_original, created_at")
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
      setLoading(false);
    };

    getPhotos();
  }, [evento.id]);

  if (loading) {
    return <p>Cargando galería...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <section>
      <h2>Galería de fotografías 📸</h2>

      {photos.length === 0 ? (
        <p>Aún no hay fotografías aprobadas para compartir.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {photos.map((foto) => (
            <img
              key={foto.id}
              src={foto.url}
              alt={foto.name_original || "Foto de la boda"}
              loading="lazy"
              style={{
                width: "100%",
                height: "220px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default PublicGallery;
