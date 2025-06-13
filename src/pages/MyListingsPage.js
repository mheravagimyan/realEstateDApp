import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMarketplace } from "../hooks/useMarketplace";
import PropertyCard from "../components/PropertyCard";
import { getMeta } from "../utils/metadata";

export default function MyListingsPage() {
  const account = localStorage.getItem("account");
  const { fetchMyListings, cancelListing } = useMarketplace();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const raw = await fetchMyListings(account);
      const withMeta = raw.map(l => ({ ...l, ...getMeta(l.hash) }));
      setListings(withMeta);
      setLoading(false);
    })();
  }, [fetchMyListings, account]);

  if (!account) return <Navigate to="/connect" replace />;
  if (loading) return <p className="text-center mt-24">Загрузка…</p>;
  if (!listings.length) return <p className="text-center mt-24">У вас нет активных лотов</p>;

  const handleCancel = async (hash) => {
    await cancelListing(hash);
    setListings(listings.filter(l => l.hash !== hash));
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <h2 className="text-2xl font-semibold mb-6">Мои лоты на продаже</h2>
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <div key={l.hash}>
            <PropertyCard {...l} />
            <button
              className="btn btn-warning btn-sm mt-2"
              onClick={() => handleCancel(l.hash)}
            >
              Отменить продажу
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
