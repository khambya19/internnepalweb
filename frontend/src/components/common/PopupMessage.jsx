import React from 'react';

const PopupMessage = ({ message, type = 'success', onClose }) => {
  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg transition-all duration-300 ${
      type === 'success'
        ? 'bg-green-100 border border-green-400 text-green-800'
        : 'bg-red-100 border border-red-400 text-red-800'
    }`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-lg font-bold text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close popup"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default PopupMessage;
