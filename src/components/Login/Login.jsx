import { useState } from "react";
import { supabase } from "../../conexion/supabase";
import imgWedding from "../../assets/wedding2.png";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startSession = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
    } else {
      console.log("Sesión iniciada correctamente");
    }

    setLoading(false);
  };

  return (
    <main className="login-album-container center">
      <img src={imgWedding} alt="foto de portada" />
      <h1>Área privada</h1>

      <p className="sub-title">Acceso exclusivo para los novios</p>

      <form onSubmit={startSession} className="form-album-login">
        <div className="input-container">
          <label>Correo</label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="input-container">
          <label>Contraseña</label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-upload">
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>

      {error && <p>{error}</p>}
    </main>
  );
}

export default Login;
