"use client";

import Link from "next/link";

const Sidebar = () => {
  const categories = ["Media", "Documents", "Software"]; // examples 

  return (
    <aside className="w-64 bg-gray-800 text-white h-full p-4 fixed">
      <h2 className="text-xl font-bold mb-6">Gloomy</h2>
      <nav className="flex flex-col gap-4">
        {categories.map((category) => (
          <Link
            key={category}
            href={`#${category.toLowerCase()}`}
            className="text-lg hover:text-gray-300"
          >
            {category}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
