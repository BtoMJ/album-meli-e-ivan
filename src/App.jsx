import { Routes, Route, Navigate } from "react-router-dom";
import Event from "./components/Event/Event";
import PrivateGallery from "./components/PrivateGallery/PrivateGallery";
import Admin from "./components/Admin/Admin";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/:slug" element={<Event />} />
      <Route path="/admin/:slug" element={<PrivateGallery />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/meli-e-ivan" />} />
    </Routes>
  );
}

export default App;
