import { Web3Storage } from "web3.storage";

/* инициализируем клиент один раз */
const client = new Web3Storage({
  token: import.meta.env.VITE_WEB3STORAGE_TOKEN,
});

/** Загружает один File → возвращает ipfs://CID */
export async function uploadFile(file) {
  const cid = await client.put([file], { wrapWithDirectory: false });
  return `ipfs://${cid}`;
}

/** Загружает JS-объект как meta.json → ipfs://CID */
export async function uploadJson(obj) {
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  const file = new File([blob], "meta.json");
  const cid  = await client.put([file], { wrapWithDirectory: false });
  return `ipfs://${cid}`;
}

/** ipfs://… → https://… (public gateway) */
export function ipfsToHttp(url) {
  if (!url?.startsWith("ipfs://")) return url;
  const cid = url.replace("ipfs://", "");
  return `https://${cid}.ipfs.dweb.link`;
}
