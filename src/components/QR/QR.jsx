import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../../conexion/supabase";
import "./QR.css";

function QR() {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerEvento = async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select("name, slug_text")
        .eq("slug_text", "meli-e-ivan")
        .single();

      if (error) {
        console.error(error);
        setError("No se pudo cargar el evento.");
      } else {
        setEvent(data);
      }

      setLoading(false);
    };

    obtenerEvento();
  }, []);

  const descargarQR = () => {
    const canvas = document.getElementById("qr-album");

    if (!canvas) return;

    const enlace = document.createElement("a");
    enlace.href = canvas.toDataURL("image/png");
    enlace.download = `QR-${event.slug}.png`;
    enlace.click();
  };

  if (loading) return <p>Cargando código QR...</p>;
  if (error) return <p>{error}</p>;
  if (!event) return null;

  const urlAlbum = `https://album-meli-e-ivan.vercel.app/${event.slug_text}`;

  return (
    <section className="qr-container">
      <h3>QR del álbum</h3>

      <p className="subtitle">
        Escanea este código para compartir tus fotografías en el álbum de{" "}
        <span>{event.name}</span>.
      </p>

      <QRCodeCanvas
        id="qr-album"
        className="qr-img"
        value={urlAlbum}
        size={200}
        level="H"
        marginSize={2}
      />

      <div className="btns-admin">
        <a
          className="btn-upload"
          href={urlAlbum}
          target="_blank"
          rel="noreferrer"
        >
          Abrir álbum
        </a>
        <button className="btn-upload" onClick={descargarQR}>
          Descargar QR
        </button>
      </div>
    </section>
  );
}

export default QR;
