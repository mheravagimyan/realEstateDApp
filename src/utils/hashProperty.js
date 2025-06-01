import { keccak256, toUtf8Bytes, solidityPackedKeccak256  } from "ethers";

/** Возвращает bytes32-хэш (0x…) из адреса и площади */
export function hashProperty(location, area) {
    return solidityPackedKeccak256(
    ["string", "uint256"],
    [location, area]
  );
  
}
