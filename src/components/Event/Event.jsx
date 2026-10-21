import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "../../conexion/supabase";
import portrait from "../../assets/foto-7-letter.png";
import Upload from "../Upload/Upload";
import PublicGallery from "../PublicGallery/PublicGallery";

import "./Event.css";

function Event() {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getEvent = async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .eq("slug_text", slug)
        .eq("active", true)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setEvent(data);
      }

      setLoading(false);
    };

    getEvent();
  }, [slug]);

  if (loading) {
    return <h1>Cargando evento...</h1>;
  }

  if (error || !event) {
    return <p>Evento no encontrado.</p>;
  }

  return (
    <section className="event-container center">
      <div className="icon-app center">
        <img src={portrait} />
      </div>

      <div className="data-event center">
        <h1>{event.name}</h1>
        <p className="date"> - {event.date} -</p>
        <p className="sub-title">
          Se parte de los recuerdos memorables de {event.type}. <br />
        </p>
      </div>

      <div className="upload-container center">
        <Upload evento={event} />
      </div>
      <div className="gallery-container">
        <h2>Fotografías Añadidas</h2>
        <PublicGallery evento={event} />
      </div>
    </section>
  );
}

export default Event;
