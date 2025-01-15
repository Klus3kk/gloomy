"use client";

export default function Header() {
  return (
    <header className="bg-black text-white flex justify-between items-center px-8 py-4 shadow">
      <h1 className="text-xl font-bold">Gloomy</h1>
      <nav className="space-x-6">
        <a href="#home" className="hover:underline">Home</a>
        <a href="#categories" className="hover:underline">Categories</a>
        <a href="#about" className="hover:underline">About</a>
      </nav>
    </header>
  );
}
