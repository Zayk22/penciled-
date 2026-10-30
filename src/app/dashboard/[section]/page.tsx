export default async function SectionPlaceholder({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const title = section.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <h1 className="font-serif text-3xl mb-2">{title}</h1>
      <p className="text-muted">This section will be built in the next batch.</p>
    </div>
  );
}