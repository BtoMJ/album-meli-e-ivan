import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "../../conexion/supabase";
import Upload from "../Upload/Upload";
import PublicGallery from "../PublicGallery/PublicGallery";

import "./Event.css";

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
    <section className="event-container ">
      <h1>{event.name}</h1>

      <p>Fecha: {event.date}</p>

      <p>Comparte tus fotografías con los novios</p>

      <Upload evento={event} />

      <PublicGallery evento={event} />
    </section>
  );
}

export default Event;
