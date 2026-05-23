export default function Spinner({ text = 'Cargando datos de SAP...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
