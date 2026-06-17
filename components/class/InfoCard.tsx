export default function InfoCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-basic/60 p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col gap-2 items-center justify-center text-center py-10 transition-transform hover:-translate-y-1">
      {icon}
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-gray-500 text-sm font-semibold">{subtitle}</p>
    </div>
  );
}
