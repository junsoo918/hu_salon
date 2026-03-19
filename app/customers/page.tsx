import Link from "next/link";
const customers = [
  {
    id: "1",
    name: "김미경",
    phone: "010-3938-8192",
    totalSales: 1359400,
    visitCount: 13,
    lastVisitAt: "2026-03-16",
  },
  {
    id: "2",
    name: "박서연",
    phone: "010-1234-5678",
    totalSales: 482000,
    visitCount: 6,
    lastVisitAt: "2026-03-11",
  },
  {
    id: "3",
    name: "이하늘",
    phone: "010-9876-5432",
    totalSales: 720000,
    visitCount: 9,
    lastVisitAt: "2026-03-14",
  },
];

export default function CustomersPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-900">고객관리</h1>
        <p className="mt-2 text-slate-600">
          고객 목록을 조회하는 페이지입니다.
        </p>
        <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            고객 검색
          </label>
          <input
            type="text"
            placeholder="이름 또는 전화번호를 입력하세요"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">고객 목록</h2>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              신규 고객 등록
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-slate-100 text-left">
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">전화번호</th>
                  <th className="px-4 py-3">총매출</th>
                  <th className="px-4 py-3">방문수</th>
                  <th className="px-4 py-3">최근방문</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-slate-900 hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{customer.phone}</td>
                    <td className="px-4 py-3">
                      {customer.totalSales.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3">{customer.visitCount}회</td>
                    <td className="px-4 py-3">{customer.lastVisitAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
