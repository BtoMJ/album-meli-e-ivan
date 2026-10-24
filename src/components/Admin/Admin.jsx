import { useEffect, useState } from "react";
import { supabase } from "../../conexion/supabase";
import Login from "../Login/Login";
import QR from "../QR/QR";
import "./Admin.css";

function Admin() {
  const [session, setSession] = useState(undefined);
  const [photos, setPhotos] = useState([]);
  const [approvedPhotos, setApprovedPhotos] = useState([]);
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

    setApprovedPhotos((updatePhotos) =>
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

      const { data: approvedData, error: approvedError } = await supabase
        .from("fotos")
        .select("*")
        .eq("state", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("No se pudieron cargar las fotografías.");
      } else {
        setPhotos(data);
        setApprovedPhotos(approvedData || []);

        const links = {};

        const allPhotos = [...(data || []), ...(approvedData || [])];

        for (const foto of allPhotos) {
          const { data: file, error: errorFile } = await supabase.storage
            .from("photos")
            .createSignedUrl(foto.storage_path, 3600);

          console.log("FOTO:", foto);

          if (errorFile) {
            console.error(errorFile);
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
    return <p className="subtitle">Comprobando acceso...</p>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <main className="admin-container center">
      <nav className="nav-container">
        <h4>Galería Privada </h4>
        <button
          className="btn-upload-2"
          onClick={() => supabase.auth.signOut()}
        >
          Cerrar sesión
        </button>
      </nav>

      <section className="welcome">
        <p className="subtitle">¡Bienvenidos! </p>
        <p className="subtitle">
          Aquí pueden aprobar cada foto que suben sus invitados antes de
          aparecer en el album público.
        </p>
      </section>

      {loading && <p className="sub-title">Cargando fotografías...</p>}

      {error && <p>{error}</p>}

      <section>
        {photos.length < 1 ? (
          <div className="data-photo-admin">
            <p className="no-photos-admin">
              Por el momento, no hay fotos que aprobar
            </p>
          </div>
        ) : (
          ""
        )}
        {photos.map((foto) => (
          <section className="pending-items-container">
            <article key={foto.id} className="pending-item">
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
                <p className="sub-title">Preparando imagen...</p>
              )}
              <div className="data-photo-admin">
                <p className="subtitle">
                  <span>Estado:</span> Pendiente
                </p>
                <p className="subtitle">
                  <span>Subido por:</span> {foto.guest}
                </p>
                <p className="subtitle">
                  <span>Nota: </span> {foto.note}
                </p>
              </div>

              <div>
                <button
                  className="btn-upload-2"
                  onClick={() => updateState(foto.id, "approved")}
                >
                  Aprobar
                </button>

                <button
                  className="btn-upload-2"
                  onClick={() => updateState(foto.id, "rejected")}
                >
                  Rechazar
                </button>

                <button
                  className="btn-upload-2"
                  onClick={() => downloadPhoto(foto)}
                >
                  Descargar
                </button>

                <button
                  className="btn-upload-2"
                  onClick={() => deletePhoto(foto)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          </section>
        ))}
      </section>

      <section style={{ marginTop: "50px" }}>
        <h2>Álbum aprobado</h2>

        {approvedPhotos.length === 0 ? (
          <p className="subtitle">No hay fotografías aprobadas.</p>
        ) : (
          <div className="approved-item-album">
            {approvedPhotos.map((foto) => (
              <div className="photo-list" key={foto.id}>
                <div className="img-container center">
                  {images[foto.id] ? (
                    <img
                      src={images[foto.id]}
                      alt={foto.name_original || "Foto del evento"}
                      className="photo-item"
                    />
                  ) : (
                    <p className="subtitle">Preparando imagen...</p>
                  )}
                </div>
                <div className="data-list">
                  <p className="data-title">Subido por:</p>
                  <p className="title">{foto.guest}</p>
                  <p className="data-title">Nota:</p>
                  <p className="title">{foto.note}</p>

                  <div className="btns-photo-admin-approved">
                    <button
                      className="btn-upload-2 "
                      onClick={() => downloadPhoto(foto)}
                    >
                      Descargar
                    </button>

                    <button
                      className="btn-upload-2 "
                      onClick={() => deletePhoto(foto)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <QR />
    </main>
  );
}

export default Admin;
