"use client";

import { useState, useEffect } from "react";

type FileCategory = Record<string, string[]>;

export default function Downloads() {
  const [fileCategories, setFileCategories] = useState<FileCategory>({});
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [enteredPassword, setEnteredPassword] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/files");
        if (!response.ok) throw new Error("Failed to fetch files");
        const data = await response.json();
        setFileCategories(data);

        // Mock file passwords for security
        const mockPasswords: Record<string, string> = {};
        Object.values(data).flat().forEach((file) => {
          mockPasswords[file] = "12345"; // Set unique passwords for each file
        });
        setPasswords(mockPasswords);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, []);

  const handleDownload = async (file: string, folder: string | null) => {
    try {
      const response = await fetch(
        `/api/download?file=${file}&password=${enteredPassword}&folder=${folder || ""}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download file");
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = url;
      link.download = file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(error.message);
    }
  };
  
  
  const filteredFilesAcrossCategories = () => {
    if (currentCategory) {
      return filteredFiles(fileCategories[currentCategory] || []);
    }
    return Object.values(fileCategories)
      .flat()
      .filter((file) => file.toLowerCase().includes(searchTerm.toLowerCase()));
  };
  
  
  
  

  const filteredFiles = (files: string[]) =>
    files.filter((file) =>
      file.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="container py-8">
      {/* Search Bar */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-bold">Downloads</h1>
        {/* <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2"
        /> */}
      </div>

      {/* Category Navigation */}
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
          {/* Breadcrumb Navigation */}
          <button
            onClick={() => setCurrentCategory(null)}
            className="text-blue-500 hover:underline mb-4"
          >
            ← Back to Categories
          </button>

          {/* File List */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFilesAcrossCategories().map((file) => (
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

      {/* Password Prompt Modal */}
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
                onClick={() => {
                  setSelectedFile(null);
                  setEnteredPassword("");
                }}
                className="btn bg-gray-500 text-white hover:bg-gray-400 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (enteredPassword) {
                    handleDownload(selectedFile, currentCategory);
                    setSelectedFile(null);
                    setEnteredPassword("");
                  } else {
                    alert("Please enter a password before submitting!");
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
