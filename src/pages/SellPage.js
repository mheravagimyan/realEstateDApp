import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ethers } from "ethers";

import { CONTRACT_ADDRESS, ABI } from "../contractInfo";
import { hashProperty } from "../utils/hashProperty";
import { saveMeta } from "../utils/metadata";

export default function SellPage() {
  const navigate = useNavigate();
  const account  = localStorage.getItem("account");
  
  /* состояние формы */
  const [location,     setLocation]     = useState("");
  const [area,         setArea]         = useState("");
  const [priceEth,     setPriceEth]     = useState("");
  const [description,  setDescription]  = useState("");
  const [files,        setFiles]        = useState([]);   // Array<File>
  const [previews,     setPreviews]     = useState([]);   // Array<URL>
  const [status,       setStatus]       = useState("");
  
  if (!account) return <Navigate to="/connect" replace />;
  /* обработка выбора файлов */
  const onFile = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  };

  /* отправка формы */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const propHash = hashProperty(location, area, description);
      const priceWei = ethers.parseEther(priceEth);

      /* 1. on-chain транзакция */
      setStatus("Отправка транзакции…");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.listProperty(propHash, priceWei);
      await tx.wait();

      /* 2. off-chain метаданные */
      let photoUrls = [];
      if (files.length) {
        photoUrls = await Promise.all(
          files.map(
            (file) =>
              new Promise((res) => {
                const r = new FileReader();
                r.onloadend = () => res(r.result);
                r.readAsDataURL(file);
              })
          )
        );
      }

      saveMeta(propHash, {
        photoUrls,        // массив изображений
        location,
        area,
        description,
        owner: account,
      });

      setStatus("Объект выставлен ✔");
      setTimeout(() => navigate("/buy"), 1200);
    } catch (err) {
      setStatus(err.shortMessage || "Ошибка при выставлении");
    }
  };

  return (
    <div className="mx-auto max-w-xl mt-10">
      <div className="card bg-base-100 shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Выставить квартиру</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <label className="text-right sm:text-end pr-2 font-medium">
              Адрес:
            </label>
            <textarea
              className="textarea textarea-bordered"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <label className="text-right sm:text-end pr-2 font-medium">
              Площадь (м²):
            </label>
            <input
              type="number"
              min="1"
              className="input input-bordered"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />

            <label className="text-right sm:text-end pr-2 font-medium">
              Цена (ETH):
            </label>
            <input
              type="number"
              min="0"
              step="0.0001"
              className="input input-bordered"
              value={priceEth}
              onChange={(e) => setPriceEth(e.target.value)}
              required
            />

            <label className="text-right sm:text-end pr-2 font-medium">
              Описание:
            </label>
            <textarea
              className="textarea textarea-bordered"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              required
            />

            <label className="text-right sm:text-end pr-2 font-medium">
              Фото:
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFile}
              className="file-input file-input-bordered"
            />
          </div>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="preview"
                  className="h-24 object-cover rounded"
                />
              ))}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full mt-4">
            Выставить
          </button>
        </form>

        {status && <p className="mt-4">{status}</p>}
      </div>
    </div>
  );
}
