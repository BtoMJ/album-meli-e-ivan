import { useState, useEffect } from "react";
import { supabase } from "../../conexion/supabase";
import "./Upload.css";

function Upload({ evento }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msj, setMsj] = useState("");
  const [guest, setGuest] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (msj) {
      const timeClose = setTimeout(() => {
        setMsj("");
      }, 3000);

      return () => clearTimeout(timeClose);
    }
  }, [msj]);

  const selectPhoto = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // setPhotos([...photos, file]);
    setPhotos(file);
    setMsj("");
  };

  const uploadPhoto = async () => {
    if (!photos) return;

    setUploading(true);
    setMsj("");

    const fileName = `${crypto.randomUUID()}-${photos.name}`;

    const rute = `${evento.id}/${fileName}`;

    // 1. Subir archivo a Storage
    const { error: errorStorage } = await supabase.storage
      .from("photos")
      .upload(rute, photos);

    if (errorStorage) {
      console.error("ERROR STORAGE:", errorStorage);
      // console.error(errorStorage);
      setMsj(`❌ Error: ${errorStorage.message}`);
      // setMsj("No se pudo subir la foto.");
      setUploading(false);
      return;
    }

    // 2. Registrar la foto en la base de datos
    const { error: errorDatabase } = await supabase.from("fotos").insert({
      event_id: evento.id,
      storage_path: rute,
      name_original: photos.name,
      guest: guest.trim() || null,
      note: note.trim() || null,
      state: "pending",
    });

    if (errorDatabase) {
      console.error(errorDatabase);
      setMsj("La foto se subió, pero no pudo registrarse.");
      setUploading(false);
      return;
    }

    setMsj("¡Foto subida correctamente!");
    setPhotos(null);
    setUploading(false);
  };

  return (
    <section className="upload center">
      <h2>Comparte tus fotos </h2>
      <p className="sub-title">Selecciona una fotografía para compartir.</p>

      <div>
        <input
          className="invisible-input"
          id="upload-input"
          type="file"
          accept="image/*"
          onChange={selectPhoto}
        />
        <label for="upload-input" className="btn-upload">
          Seleccionar foto
        </label>
      </div>

      {photos && (
        <div>
          {photos.name && (
            <section className="photo-info">
              <div className="img-upload-container ">
                <h3>Preselección:</h3>
                <img
                  className="preview-image"
                  src={URL.createObjectURL(photos)}
                  alt="Foto seleccionada"
                />
              </div>
              <div className="upload-form">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={guest}
                  onChange={(e) => setGuest(e.target.value)}
                  maxLength={50}
                  required
                />
                <textarea
                  placeholder="Algo que desees decir..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={150}
                  rows={3}
                ></textarea>
                <button
                  className="btn-upload"
                  onClick={uploadPhoto}
                  disabled={uploading}
                >
                  {uploading ? "Subiendo..." : "Subir foto"}
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {msj && <p className="upload-success">{msj}</p>}
    </section>
  );
}

export default Upload;
