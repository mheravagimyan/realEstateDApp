import React from "react";
import { Link, Navigate } from "react-router-dom";
const bg = `https://source.unsplash.com/random/1600x900/?city,${Date.now()}`;

export default function HomePage() {
  const account = localStorage.getItem("account");
  if (!account) return <Navigate to="/connect" replace />;

  return (
    <div className="hero min-h-[70vh]" style={{ backgroundImage: `url(${bg})` }}>
      <div className="hero-overlay bg-opacity-60" />
      <div className="hero-content text-center text-neutral-content flex-col gap-8">
        <h1 className="text-4xl font-bold">
          Децентрализованная торговля недвижимостью
        </h1>
        <div className="flex gap-6">
          <Link to="/sell" className="btn btn-primary">Продать</Link>
          <Link to="/buy"  className="btn btn-secondary">Купить</Link>
        </div>
      </div>
    </div>
  );
}
