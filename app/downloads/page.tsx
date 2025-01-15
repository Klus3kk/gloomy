"use client";

import { useState, useEffect } from "react";

type FileCategory = Record<string, Record<string, { path: string; password: string }>>;

export default function Downloads() {
  const [fileCategories, setFileCategories] = useState<FileCategory>({});
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [enteredPassword, setEnteredPassword] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/files.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch files: ${response.statusText}`);
        }
        const data = await response.json();
        setFileCategories(data);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };
    fetchFiles();
  }, []);

  const handleDownload = (file: string, category: string) => {
    const fileInfo = fileCategories[category][file];

    if (fileInfo.password !== enteredPassword) {
      alert("Invalid password!");
      return;
    }

    const filePath = `/files/media/${fileInfo.path}`;
    const link = document.createElement("a");
    link.href = filePath;
    link.download = file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setEnteredPassword("");
  };

  const filteredFiles = (category: string) =>
    Object.keys(fileCategories[category]).filter((file) =>
      file.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="container py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-bold">Downloads</h1>
      </div>

      {currentCategory === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(fileCategories).map((category) => (
            <div
              key={category}
              className="card cursor-pointer"
              onClick={() => setCurrentCategory(category)}
            >
              <h2 className="card-title text-center capitalize">{category}</h2>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setCurrentCategory(null)}
            className="text-blue-500 hover:underline mb-4"
          >
            ← Back to Categories
          </button>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles(currentCategory).map((file) => (
              <li key={file} className="card">
                <div className="flex flex-col justify-between items-center p-4">
                  <span className="truncate mb-2">{file}</span>
                  <button
                    onClick={() => setSelectedFile(file)}
                    className="btn bg-[rgb(0,79,121)] hover:bg-[rgb(0,79,140)]"
                  >
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#0d1c26] text-white rounded-lg p-8 shadow-2xl text-center w-80">
            <h3 className="text-xl font-bold mb-4">Enter Password</h3>
            <input
              type="password"
              placeholder="Enter password"
              value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)}
              className="w-full border border-gray-600 rounded px-4 py-2 mb-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setSelectedFile(null)}
                className="btn bg-gray-500 text-white hover:bg-gray-400 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (currentCategory && selectedFile) {
                    handleDownload(selectedFile, currentCategory);
                    setSelectedFile(null);
                  } else {
                    alert("Error: No file or category selected!");
                  }
                }}
                className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
