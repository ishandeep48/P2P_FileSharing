import React, { useRef, useState } from 'react';

export default function FileShare({ sendFile, files, onFileChange, isSender, peerConnected }) {
  const fileInputRef = useRef();
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (onFileChange) onFileChange(file);
  };

  const handleSend = () => {
    if (selectedFile && sendFile) {
      sendFile(selectedFile);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-white bg-opacity-10 rounded-lg shadow-lg mx-auto max-w-xl mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">P2P File Sharing Room</h2>
      <div className="w-full flex flex-col md:flex-row items-center gap-4 mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSend}
          disabled={!selectedFile || !peerConnected}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          Send File
        </button>
      </div>
      <div className="w-full mt-4">
        <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-white">Files Shared</h3>
        <ul className="space-y-2">
          {files.length === 0 && <li className="text-gray-500">No files shared yet.</li>}
          {files.map((file, idx) => (
            <li key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded p-2 shadow">
              <span className="truncate max-w-xs">{file.name}</span>
              {file.url && (
                <a
                  href={file.url}
                  download={file.name}
                  className="ml-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded shadow text-sm"
                >
                  Download
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
