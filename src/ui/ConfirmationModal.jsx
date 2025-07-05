// components/ConfirmationModal.js
export default function ConfirmationModal({ title, description, onConfirm, onCancel, onView }) {
  return (
    <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-gray-700 mb-4">{description}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          {onView && (
            <button
              onClick={onView}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              View Request Letter
            </button>
          )}
          <button
            onClick={onConfirm}
            className="bg-[#145DA0] text-white px-4 py-2 rounded hover:bg-[#0e3e6e]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
