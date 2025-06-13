import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../contractInfo";

export function useMarketplace() {
  const [provider, setProvider] = useState(null);
  const [marketplace, setMarketplace] = useState(null);

  useEffect(() => {
    if (!window.ethereum) return;
    const p = new ethers.BrowserProvider(window.ethereum);
    setProvider(p);
    setMarketplace(new ethers.Contract(CONTRACT_ADDRESS, ABI, p));
  }, []);

  /** Fetch all active listings for BuyPage */
  const fetchListings = useCallback(async () => {
    if (!marketplace) return [];
    const logs = await marketplace.queryFilter(
      marketplace.filters.PropertyListed(),
      0,
      "latest"
    );
    const result = [];
    for (const ev of logs) {
      const { propHash } = ev.args;
      const lst = await marketplace.listings(propHash);
      if (lst.forSale) {
        result.push({ hash: propHash, priceWei: lst.price });
      }
    }
    return result;
  }, [marketplace]);

  /** Fetch only my active listings */
  const fetchMyListings = useCallback(async (account) => {
    if (!marketplace) return [];
    const hashes = await marketplace.getOwnerProperties(account);
    const result = [];
    for (const propHash of hashes) {
      const lst = await marketplace.listings(propHash);
      if (lst.forSale) {
        result.push({ hash: propHash, priceWei: lst.price });
      }
    }
    return result;
  }, [marketplace]);

  const buyProperty = useCallback(
    async (hash, priceWei) => {
      if (!provider || !marketplace) throw new Error("Not ready");
      const signer = await provider.getSigner();
      const cont = marketplace.connect(signer);
      return await cont.buyProperty(hash, { value: priceWei });
    },
    [provider, marketplace]
  );

  const cancelListing = useCallback(
    async (hash) => {
      if (!provider || !marketplace) throw new Error("Not ready");
      const signer = await provider.getSigner();
      const cont = marketplace.connect(signer);
      return await cont.cancelListing(hash);
    },
    [provider, marketplace]
  );

  return {
    fetchListings,
    fetchMyListings,
    buyProperty,
    cancelListing,
  };
}
