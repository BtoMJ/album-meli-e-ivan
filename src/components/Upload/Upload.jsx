import { useState } from "react";
import { supabase } from "../../conexion/supabase";

function Upload({ evento }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msj, setMsj] = useState("");

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
      state: "pending",
    });

    if (errorDatabase) {
      console.error(errorDatabase);
      setMsj("La foto se subió, pero no pudo registrarse.");
      setUploading(false);
      return;
    }

    setMsj("¡Foto subida correctamente! 📸");
    setPhotos(null);
    setUploading(false);
  };

  return (
    <section>
      <h2>Comparte tus fotos 📸</h2>
      <p>Selecciona una fotografía para compartirla con los novios.</p>

      <input type="file" accept="image/*" onChange={selectPhoto} />

      {photos && (
        <div>
          <p>
            <strong>Foto seleccionada:</strong> {photos.name}
          </p>

          <button onClick={uploadPhoto} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir foto"}
          </button>
        </div>
      )}

      {/* {photos.length > 0 && (
        <div>
          <p>{photos[0].name}</p>

          <button onClick={uploadPhoto} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir foto"}
          </button>
        </div>
      )} */}

      {msj && <p>{msj}</p>}
    </section>
  );
}

export default Upload;

// import { useState } from "react";

// function Upload() {
//   const [photos, setPhotos] = useState([]);

//   const selectPhotos = (event) => {
//     const files = Array.from(event.target.files);

//     setPhotos(files);
//   };

//   return (
//     <section>
//       <h2>Comparte tus fotos 📸</h2>

//       <p>Selecciona las fotografías que quieras compartir con los novios.</p>

//       <input type="file" accept="image/*" multiple onChange={selectPhotos} />

//       {photos.length > 0 && (
//         <div>
//           <h3>Fotos seleccionadas: {photos.length}</h3>

//           {photos.map((photo, index) => (
//             <div key={index}>
//               <p>{photo.name}</p>
//             </div>
//           ))}
//         </div>
//       )}
//     </section>
//   );
// }

// export default Upload;
