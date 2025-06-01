import { ethers } from "ethers";
import { Link } from "react-router-dom";

/** Карточка лота в каталоге /buy */
export default function PropertyCard({ hash, priceWei, photoUrls }) {
  return (
    <div className="card w-72 bg-base-100 shadow-xl">
      <figure>
        <img
          src={
            (photoUrls && photoUrls[0]) ||
            "https://source.unsplash.com/random/600x400/?apartment"
          }
          alt="apartment"
          className="h-48 w-full object-cover"
        />
      </figure>

      <div className="card-body p-4">
        <p className="text-lg font-bold">
          {ethers.formatEther(priceWei)} ETH
        </p>
        <Link to={`/property/${hash}`} className="btn btn-primary btn-sm">
          Подробнее
        </Link>
      </div>
    </div>
  );
}
