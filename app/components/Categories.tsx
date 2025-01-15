type CategoriesProps = {
    fileCategories: Record<string, string[]>;
    onDownload: (category: string, filename: string) => void;
  };
  
  export default function Categories({ fileCategories, onDownload }: CategoriesProps) {
    return (
      <section id="categories" className="container my-12">
        <h2 className="text-3xl font-bold text-center mb-8">File Categories</h2>
        {Object.entries(fileCategories).map(([category, files]) => (
          <div key={category} className="mb-12">
            <h3 className="text-2xl font-semibold mb-4">{category}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <li key={file} className="card">
                  <span className="text-sm">{file}</span>
                  <button
                    onClick={() => onDownload(category, file)}
                    className="btn bg-blue-500 hover:bg-blue-600 mt-2"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    );
  }
  