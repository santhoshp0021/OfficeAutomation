export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100px] gap-3">
      <div className="w-9 h-9 border-4 border-beige-100 border-t-primary rounded-full animate-spin" />
      <p className="text-primary font-semibold text-sm">{message}</p>
    </div>
  );
}
