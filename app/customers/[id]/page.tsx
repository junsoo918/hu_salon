type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">
          고객 상세 페이지
        </h1>
        <p className="mt-2 text-slate-600">
          고객 ID: {id}
        </p>
      </div>
    </main>
  );
}