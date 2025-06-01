import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMarketplace } from "../hooks/useMarketplace";
import PropertyCard from "../components/PropertyCard";
import { getMeta } from "../utils/metadata";

export default function BuyPage() {
  const account = localStorage.getItem("account");
  
  const { fetchListings } = useMarketplace();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    (async () => {
      setLoading(true);
      const raw = await fetchListings();
      // обогащаем метаданными
      const data = raw.map(l => ({ ...l, ...getMeta(l.hash) }));
      setListings(data);
      setLoading(false);
    })();
  }, [fetchListings]);
  
  if (!account) return <Navigate to="/connect" replace />;
  if (loading) return <p className="text-center mt-24">Загрузка…</p>;
  if (!listings.length) return <p className="text-center mt-24">Лоты отсутствуют</p>;

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <h2 className="text-2xl font-semibold mb-6">Выберите квартиру</h2>

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listings.map((l) => (
          <PropertyCard key={l.hash} {...l} />
        ))}
      </div>
    </div>
  );
}
