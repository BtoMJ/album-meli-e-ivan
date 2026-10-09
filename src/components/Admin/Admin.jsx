import { useEffect, useState } from "react";
import { supabase } from "../../conexion/supabase";
import Login from "../Login/Login";

function Admin() {
  const [session, setSession] = useState(undefined);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState({});

  const updateState = async (id, newState) => {
    const { error } = await supabase
      .from("fotos")
      .update({ state: newState })
      .eq("id", id);

    if (error) {
      console.error(error);
      setError("No se pudo actualizar la fotografía.");
      return;
    }

    // Quitar la foto de la lista de pendientes
    setPhotos((currentPhotos) =>
      currentPhotos.filter((photo) => photo.id !== id),
    );
  };

  const downloadPhoto = async (foto) => {
    const { data, error } = await supabase.storage
      .from("photos")
      .download(foto.storage_path);

    if (error) {
      console.error(error);
      setError("No se pudo descargar la fotografía.");
      return;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement("a");

    link.href = url;
    link.download = foto.name_original || "fotografia.jpg";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const deletePhoto = async (foto) => {
    const prove = window.confirm(
      "¿Seguro que deseas eliminar esta fotografía? Esta acción no se puede deshacer.",
    );

    if (!prove) return;

    setError("");

    // 1. Eliminar el archivo del almacenamiento
    const { error: errorStorage } = await supabase.storage
      .from("photos")
      .remove([foto.storage_path]);

    if (errorStorage) {
      console.error(errorStorage);
      setError("No se pudo eliminar el archivo.");
      return;
    }

    // 2. Eliminar el registro de la base de datos
    const { error: errorDatabase } = await supabase
      .from("fotos")
      .delete()
      .eq("id", foto.id);

    if (errorDatabase) {
      console.error(errorDatabase);
      setError("El archivo se eliminó, pero no se pudo eliminar su registro.");
      return;
    }

    // 3. Actualizar la galería sin recargar
    setPhotos((updatePhotos) =>
      updatePhotos.filter((item) => item.id !== foto.id),
    );

    setImages((currentPhotos) => {
      const newPhotos = { ...currentPhotos };
      delete newPhotos[foto.id];
      return newPhotos;
    });
  };

  useEffect(() => {
    const testSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    testSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const getPhotos = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("fotos")
        .select("*")
        .eq("state", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("No se pudieron cargar las fotografías.");
      } else {
        setPhotos(data);

        const links = {};

        for (const foto of data) {
          const { data: file, error: errorFile } = await supabase.storage
            .from("photos")
            .createSignedUrl(foto.storage_path, 3600);

          console.log("FOTO:", foto);

          if (errorFile) {
            console.error("ERROR AL CREAR URL:", errorFile);
            // console.error(errorFile);
            continue;
          }
          console.log("URL GENERADA:", file.signedUrl);

          links[foto.id] = file.signedUrl;
        }
        setImages(links);
      }

      setLoading(false);
    };

    getPhotos();
  }, [session]);

  if (session === undefined) {
    return <p>Comprobando acceso...</p>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <main>
      <h1>Galería privada 💍</h1>
      <p>¡Bienvenidos! Ya iniciaron sesión correctamente.</p>

      <button onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>

      {loading && <p>Cargando fotografías...</p>}

      {error && <p>{error}</p>}

      <section>
        {photos.map((foto) => (
          <article
            key={foto.id}
            style={{
              marginBottom: "24px",
              maxWidth: "350px",
            }}
          >
            {images[foto.id] ? (
              <img
                src={images[foto.id]}
                alt={foto.name_original || "Foto del evento"}
                style={{
                  width: "100%",
                  height: "250px",
                  objectFit: "cover",
                  borderRadius: "12px",
                }}
              />
            ) : (
              <p>Preparando imagen...</p>
            )}
            <p>{foto.name_original}</p>
            <p>Estado: {foto.state}</p>

            <div>
              <button onClick={() => updateState(foto.id, "approved")}>
                Aprobar
              </button>

              <button onClick={() => updateState(foto.id, "rejected")}>
                Rechazar
              </button>

              <button onClick={() => downloadPhoto(foto)}>Descargar</button>

              <button onClick={() => deletePhoto(foto)}>Eliminar foto</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Admin;
