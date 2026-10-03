// Shared page wrapper matching the availability page's look.
export function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <main className="flex-1 p-8 text-black">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        {description && <p className="mb-6 text-gray-600">{description}</p>}
        {children}
      </div>
    </main>
  );
}
