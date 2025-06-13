import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar           from "./components/Navbar";
import ConnectPage      from "./pages/ConnectPage";
import HomePage         from "./pages/HomePage";
import SellPage         from "./pages/SellPage";
import BuyPage          from "./pages/BuyPage";
import PropertyPage     from "./pages/PropertyPage";
import MyListingsPage   from "./pages/MyListingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/connect"        element={<ConnectPage />} />
        <Route path="/"               element={<HomePage />} />
        <Route path="/sell"           element={<SellPage />} />
        <Route path="/buy"            element={<BuyPage />} />
        <Route path="/my-listings"    element={<MyListingsPage />} />
        <Route path="/property/:hash" element={<PropertyPage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
