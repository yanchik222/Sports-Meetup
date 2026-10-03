// Placeholder for pages that haven't been built yet.
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex-1 p-8 text-black">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        <p className="mb-6 text-gray-600">{description}</p>
        <p className="rounded border border-dashed p-6 text-center text-gray-500">Coming soon</p>
      </div>
    </main>
  );
}
