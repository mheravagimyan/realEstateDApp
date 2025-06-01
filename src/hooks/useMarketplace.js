import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../contractInfo";

export function useMarketplace() {
  const [provider, setProvider] = useState(null);
  const [marketplace, setMarketplace] = useState(null);

  /* инициализируем провайдер один раз */
  useEffect(() => {
    if (!window.ethereum) return;
    const p = new ethers.BrowserProvider(window.ethereum);
    setProvider(p);
    setMarketplace(new ethers.Contract(CONTRACT_ADDRESS, ABI, p));
  }, []);

  /** Получить ВСЕ активные лоты */
  const fetchListings = useCallback(async () => {
    if (!marketplace) return [];
    /* 1. читаем события PropertyListed */
    // ―–– query all “PropertyListed” events с 0-го блока до последнего
    const logs = await marketplace.queryFilter(
        marketplace.filters.PropertyListed(),   // готовый фильтр
        0,                                      // fromBlock   (BigInt или number)
        "latest"                                // toBlock
    );

    // logs уже PARSED, поля лежат в logs[i].args
    const decoded = logs;   // переименовываем переменную, остальной код не меняется

    /* 2. фильтруем по ещё не проданным */
    const result = [];
    for (const ev of decoded) {
      const { propHash, price } = ev.args;
      const lst = await marketplace.listings(propHash);
      if (lst.forSale) {
        result.push({
          hash: propHash,
          priceWei: lst.price,
        });
      }
    }
    return result;
  }, [marketplace, provider]);

  /** Купить объект */
  const buyProperty = useCallback(
    async (hash, priceWei) => {
      if (!window.ethereum) throw new Error("MetaMask required");
      const signer = await provider.getSigner();
      const cont   = marketplace.connect(signer);
      const tx = await cont.buyProperty(hash, { value: priceWei });
      return tx;
    },
    [provider, marketplace]
  );

  return { fetchListings, buyProperty };
}
