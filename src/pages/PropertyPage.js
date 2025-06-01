import React, { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { FaArrowLeft } from "react-icons/fa";

import { useMarketplace } from "../hooks/useMarketplace";
import { getMeta } from "../utils/metadata";

export default function PropertyPage() {
  const { hash }   = useParams();
  const navigate   = useNavigate();
  const account    = localStorage.getItem("account");
  
  const { fetchListings, buyProperty } = useMarketplace();
  const [lot, setLot]     = useState(null);
  const [status, setStatus] = useState("");
  
  /* загружаем данные + метаданные */
  useEffect(() => {
    (async () => {
      const list = await fetchListings();
      const base = list.find((l) => l.hash.toLowerCase() === hash.toLowerCase());
      if (!base) return setLot(null);
      setLot({ ...base, ...getMeta(hash) });
    })();
  }, [hash, fetchListings]);
  
  if (!account) return <Navigate to="/connect" replace />;
  if (!lot) return <p className="text-center mt-24">Лот не найден</p>;

  /* покупка */
  const handleBuy = async () => {
    try {
      setStatus("Отправка транзакции…");
      const tx = await buyProperty(lot.hash, lot.priceWei);
      setStatus("Ждём майнинга…");
      await tx.wait();
      setStatus("Успешно куплено ✔");
    } catch (err) {
      setStatus(err.shortMessage || "Ошибка");
    }
  };

  /* главная (первая) фотка */
  const hero = (lot.photoUrls && lot.photoUrls[0]) ||
               "https://source.unsplash.com/random/1200x800/?apartment";

  return (
    <>
      {/* кнопка «назад» */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost absolute left-4 top-4 z-10 flex items-center gap-1"
      >
        <FaArrowLeft /> Назад
      </button>

      {/* hero-баннер */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img src={hero} alt="apartment hero"
             className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-3xl font-bold drop-shadow-lg">
            {ethers.formatEther(lot.priceWei)} ETH
          </p>
        </div>
      </div>

      {/* детали */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        <div className="card bg-base-100 shadow p-6">
          <h2 className="text-xl font-semibold mb-3">Детали квартиры</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p><strong>Адрес:</strong> {lot.location}</p>
            <p><strong>Площадь:</strong> {lot.area} м²</p>
            <p className="sm:col-span-2">
              <strong>Описание:</strong> {lot.description}
            </p>
          </div>
        </div>

        {/* галерея дополнительных фото */}
        {lot.photoUrls?.length > 1 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Фотографии</h3>
            <div className="flex flex-wrap gap-3">
              {lot.photoUrls.slice(1).map((url, i) => (
                <img key={i} src={url} alt="gallery"
                     className="h-32 object-cover rounded" />
              ))}
            </div>
          </div>
        )}

        {/* кнопка Купить / надпись */}
        <div className="flex items-center justify-between">
          <button onClick={handleBuy} className="btn btn-primary">
            Купить
          </button>
          {status && <p className="text-sm">{status}</p>}
        </div>
      </div>
    </>
  );
}
