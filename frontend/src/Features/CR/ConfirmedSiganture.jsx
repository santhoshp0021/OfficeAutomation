export default function ConfirmedSignature({ label, name, date, confirmed, onConfirm, canSign }) {
  return (
    <div className="mt-6 space-y-1 text-sm">
      <div className="flex justify-between">
        <span>{label}:</span>
        <span>Date: {date || "__________"}</span>
      </div>
      <div className="flex justify-between items-center">
        <span>Signature:</span>
        {confirmed ? (
          <span className="font-bold text-green-700">Confirmed by {name}</span>
        ) : canSign ? (
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={onConfirm}
          >
            Confirm
          </button>
        ) : (
          <span className="text-gray-400 italic">Not allowed</span>
        )}
      </div>
    </div>
  );
}
