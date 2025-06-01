import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ConnectPage() {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (!window.ethereum) return setError("Установите MetaMask.");
    try {
      const [acc] = await window.ethereum.request({ method: "eth_requestAccounts" });
      localStorage.setItem("account", acc);
      navigate("/");
    } catch {
      setError("Пользователь отклонил подключение.");
    }
  };

  return (
    <div className="flex flex-col items-center mt-32 gap-6">
      <h1 className="text-2xl font-semibold">Подключите MetaMask</h1>
      <button
        onClick={connectWallet}
        className="bg-primary hover:bg-primaryDark text-white px-6 py-2 rounded"
      >
        Connect MetaMask
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
