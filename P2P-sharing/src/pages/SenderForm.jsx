import React, { useState } from "react";

export default function SenderForm({ connectionId, generateNewId, isSocket, uploadFile, dataChOpen }) {
  const [file, setFile] = useState(null);

  const fileChange = (evt) => {
   const fill=evt.target.files[0];
   if(fill){
    setFile(fill);
   }
  };
  const submitFile = () => {
   console.log('test 1');
    if (file) uploadFile(file);
  };
  return (
    <div className="flex flex-col items-center justify-center mt-16">
      {isSocket && (
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Your Connection ID:{" "}
          <span className="text-blue-600">{connectionId}</span>
        </h1>
      )}
      <button
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition duration-200"
        onClick={generateNewId}
      >
        Click here to generate new connection ID
      </button>
      <input
        type="file"
        onChange={fileChange}
        className="mb-4 block w-72 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {!dataChOpen && <p>The Data Channel is still closed can't share any file to anyone. </p>}
      <button
        className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow transition duration-200 `}
        onClick={submitFile}
      //   disabled={!(file && dataChOpen)}
      >
        SEND FILE!!
      </button>
    </div>
  );
}