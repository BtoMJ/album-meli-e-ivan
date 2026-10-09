import { useEffect, useState } from "react";
import { supabase } from "../../conexion/supabase";
import "./PrivateGallery.css";

function PrivateGalery({ evento }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const obtenerFotos = async () => {
      const { data, error } = await supabase
        .from("fotos")
        .select("*")
        .eq("event_id", evento.id)
        .eq("state", "pending")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setPhotos(data);
      }

      setLoading(false);
    };

    obtenerFotos();
  }, [evento.id]);

  if (loading) {
    return <p>Cargando fotografías...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (photos.length === 0) {
    return <p>No hay fotografías pendientes.</p>;
  }

  return (
    <section>
      <h2>Fotografías pendientes</h2>

      <p>
        Hay {photos.length} fotografía
        {photos.length !== 1 ? "s" : ""} pendiente
        {photos.length !== 1 ? "s" : ""}.
      </p>

      {photos.map((photo) => (
        <div key={photo.id}>
          <p>{photo.nombre_original}</p>
        </div>
      ))}
    </section>
  );
}

export default PrivateGalery;
