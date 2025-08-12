import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import ProgressBar from '../components/ProgressBar';

export default function ReceiverForm({
  connectTO,
  downloadURL,
  dataChOpen,
  showApprove,
  setIsReadyToDownload,
  transferCompletion,
  speed,
  setWantsClose
}) {
  const [count, setCount] = useState(0);
  const [conId, setConId] = useState('');
  const [sender, setSender] = useState();
  const [wantsQR, setWantsQR] = useState(false);

  const handleQRReqButton = () => {
    setWantsQR(!wantsQR);
  };

  const connectViaQR = (data) => {
    connectTO(data[0].rawValue);
    setSender(data[0].rawValue);
    console.log('data to via qr is ', data[0].rawValue);
    setWantsQR(false);
  };

  const updateConId = (evt) => {
    setConId(evt.target.value);
  };

  const connectToSender = () => {
    setCount(count => count + 1);
    connectTO(conId);
  };

  const approveDownload = () => {
    setIsReadyToDownload(true);
  };

  const close = () => {
    setWantsClose(true);
  };

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Connection Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            📥 Receive Files
          </h2>

          {/* QR Scanner Section */}
          <div className="text-center mb-8">
            <button
              onClick={handleQRReqButton}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              {wantsQR ? '📷 Close Scanner' : '📷 Open QR Scanner'}
            </button>

            {wantsQR && (
              <div className="mt-6 flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <Scanner
                    onScan={connectViaQR}
                    styles={{ width: '300px', height: '300px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Manual Connection */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Or Enter Connection ID Manually</h3>
              <input
                type="text"
                value={conId}
                onChange={updateConId}
                className="w-full max-w-md px-6 py-4 rounded-xl border-2 border-white/30 bg-white/10 text-white text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50"
                placeholder="Enter Connection ID"
              />
            </div>

            <div className="text-center">
              <button
                onClick={connectToSender}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                🔗 Connect
              </button>
            </div>
          </div>

          {/* Connection Status */}
          {sender && (
            <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
              <p className="text-green-200 font-semibold mb-3">
                ✅ Connected to sender: {sender}
              </p>
              <button
                onClick={close}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent text-sm"
              >
                🔌 Disconnect
              </button>
            </div>
          )}

          {count > 0 && !dataChOpen && (
            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-center">
              <p className="text-yellow-200">
                ⏳ Establishing connection... Please wait
              </p>
            </div>
          )}
        </div>

        {/* File Approval Section */}
        {showApprove && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white/20">
            <h3 className="text-2xl font-bold text-white text-center mb-6">
              📄 Incoming File Transfer
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={approveDownload}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                ✅ Approve Download
              </button>
              <button
                onClick={close}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                ❌ Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {(transferCompletion > 0 || speed > 0) && (
          <ProgressBar
            progress={transferCompletion}
            speed={speed}
          />
        )}
      </div>
    </div>
  );
}