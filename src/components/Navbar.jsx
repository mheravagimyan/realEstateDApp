import { Link } from "react-router-dom";
import { FaEthereum } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-primary to-blue-800 text-white shadow">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <FaEthereum /> Real Estate DApp
        </Link>
        <div className="flex gap-6 text-sm">
          <Link to="/sell"        className="hover:text-accent">Продать</Link>
          <Link to="/buy"         className="hover:text-accent">Купить</Link>
          <Link to="/my-listings" className="hover:text-accent">Мои лоты</Link>
        </div>
      </div>
    </nav>
  );
}
