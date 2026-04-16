import { Link } from "react-router-dom";
import { CircleAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full px-5 absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center">
      <CircleAlert className="mb-4" size={48} />
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        Stránka nenalezena
      </h1>
      <p className="text-lg text-muted-foreground mb-6">
        Omlouváme se, ale stránka, kterou hledáte, neexistuje.
      </p>
      <Link
        to="/"
        className="border-2 border-primary-700 rounded-xl p-3 text-primary hover:bg-primary/10"
      >
        Zpět na domovskou stránku
      </Link>
    </div>
  );
}
