"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Search, User, Users, UserPlus, AlertCircle } from "lucide-react"

// --- 1. 타입 정의 ---
interface Customer {
  id: string;
  name: string;
  phone: string;
  grade: string;
  memo: string;
}

interface HistoryItem {
  id: string;
  customer_id: string;
  date: string;
  type: string;
  menu: string;
  designer: string;
  price: number;
  method: string;
}

export default function Dashboard() {
  // --- 2. 상태 관리 (States) ---
  const [searchName, setSearchName] = useState(""); // 검색창 이름 입력값
  const [searchResults, setSearchResults] = useState<Customer[]>([]); // 동명이인 리스트
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null); // 선택된 고객
  const [history, setHistory] = useState<HistoryItem[]>([]); // 시술 내역
  
  // 신규 고객 등록용 상태
  const [isCustDialogOpen, setIsCustDialogOpen] = useState(false);
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustMemo, setNewCustMemo] = useState("");

  // 시술 등록/수정용 상태
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMenu, setEditMenu] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [newMenu, setNewMenu] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newMethod, setNewMethod] = useState("card");

  // --- 3. 고객 관련 함수 ---

  // 이름으로 고객 검색 (동명이인 대응)
  const handleCustomerSearch = async () => {
    if (!searchName.trim()) return alert("조회할 이름을 입력해주세요.");

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('name', searchName.trim());

    if (error) return alert("조회 오류 발생");

    if (data && data.length > 0) {
      if (data.length === 1) {
        selectCustomer(data[0]);
      } else {
        setSearchResults(data); // 동명이인 리스트 노출
        setSelectedCustomer(null);
        setHistory([]);
      }
    } else {
      alert("등록되지 않은 고객입니다.");
      setSearchResults([]);
      setSelectedCustomer(null);
    }
  };

  // 신규 고객 저장
  const handleCustomerSave = async () => {
    if (!searchName.trim()) return alert("이름을 입력해주세요.");

    const { data, error } = await supabase
      .from('customers')
      .insert([{ 
        name: searchName.trim(), 
        phone: newCustPhone, 
        memo: newCustMemo,
        grade: '일반' 
      }])
      .select()
      .single();

    if (error) {
      alert("고객 등록 실패: " + error.message);
    } else {
      alert(`${searchName}님이 등록되었습니다.`);
      setIsCustDialogOpen(false);
      setNewCustPhone("");
      setNewCustMemo("");
      if (data) selectCustomer(data); // 등록 후 자동 선택
    }
  };

  // 고객 최종 선택 처리
  const selectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
    setSearchName(customer.name);
    fetchHistory(customer.id);
  };

  // --- 4. 시술 내역 관련 함수 ---

  const fetchHistory = async (customerId: string) => {
    const { data } = await supabase
      .from('history')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleHistorySave = async () => {
    if (!selectedCustomer) return alert("고객을 먼저 조회해주세요.");
    const { error } = await supabase.from('history').insert([{
      customer_id: selectedCustomer.id,
      menu: newMenu,
      price: Number(newPrice),
      method: newMethod,
      date: new Date().toLocaleDateString('ko-KR').slice(5, -1).replace('. ', '-'),
      type: "시술",
      designer: "원장님"
    }]);

    if (!error) {
      setNewMenu(""); setNewPrice(""); setIsHistoryDialogOpen(false);
      fetchHistory(selectedCustomer.id);
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('history')
      .update({ menu: editMenu, price: Number(editPrice) })
      .eq('id', id);
    if (!error) {
      setEditingId(null);
      if (selectedCustomer) fetchHistory(selectedCustomer.id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('history').delete().eq('id', id);
    if (!error && selectedCustomer) fetchHistory(selectedCustomer.id);
  };

  const totalSales = history.reduce((acc, cur) => acc + (Number(cur.price) || 0), 0);

  return (
    <main className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-4 max-w-7xl mx-auto">
      
      {/* [1. 고객 조회 & 신규 등록 섹션] */}
      <Card className="border-blue-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-blue-600">
              <User className="w-5 h-5" />
              <CardTitle className="text-lg font-bold">고객 정보 조회</CardTitle>
            </div>
            
            <Dialog open={isCustDialogOpen} onOpenChange={setIsCustDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold h-9">
                  <UserPlus className="w-4 h-4 mr-2" /> 신규 고객 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader><DialogTitle className="text-xl font-bold">신규 고객 등록</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">고객 성함</Label>
                    <Input placeholder="이름" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">연락처</Label>
                    <Input placeholder="010-0000-0000" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">메모</Label>
                    <Input placeholder="특이사항" value={newCustMemo} onChange={(e) => setNewCustMemo(e.target.value)} />
                  </div>
                  <Button className="w-full bg-blue-600 h-12 text-lg font-bold" onClick={handleCustomerSave}>등록 완료</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input 
                placeholder="고객 성함 입력" 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                className="h-11 text-base border-slate-200"
              />
            </div>
            <Button onClick={handleCustomerSearch} className="bg-slate-800 h-11 px-6">
              <Search className="w-4 h-4 mr-2" /> 조회
            </Button>
          </div>
        </CardHeader>

        {/* [동명이인 리스트] */}
        {searchResults.length > 1 && (
          <div className="px-4 pb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> 동명이인이 있습니다. 선택해주세요:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.map((c) => (
                  <button key={c.id} onClick={() => selectCustomer(c)} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-500 text-left">
                    <div>
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <span className="ml-2 text-xs text-slate-500">{c.phone}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{c.grade}</Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* [선택된 고객 카드] */}
        {selectedCustomer && (
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 border-t pt-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">고객 정보</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-800">{selectedCustomer.name}</span>
                  <Badge className="bg-blue-600">{selectedCustomer.grade}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">연락처</p>
                <p className="text-sm font-medium">{selectedCustomer.phone}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                <p className="text-[10px] text-blue-600 font-bold mb-1">누적 매출</p>
                <p className="text-lg font-black text-blue-700">{totalSales.toLocaleString()}원</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 hidden md:block">
                <p className="text-[10px] text-yellow-700 font-bold mb-1">메모 📌</p>
                <p className="text-xs text-yellow-800 line-clamp-1 italic">{selectedCustomer.memo || "메모 없음"}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* [2. 필터 & 시술 등록] */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input placeholder="시술 메뉴명 검색" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="pl-10 h-11 bg-white" />
        </div>
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedCustomer} className="bg-blue-600 h-11 font-bold px-6">+ 새 시술 등록</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle className="text-xl font-bold">시술 등록</DialogTitle></DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2"><Label className="text-sm font-bold">시술 메뉴</Label><Input value={newMenu} onChange={(e)=>setNewMenu(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-sm font-bold">금액</Label><Input type="number" value={newPrice} onChange={(e)=>setNewPrice(e.target.value)} /></div>
              <div className="space-y-2">
                <Label className="text-sm font-bold">결제 수단</Label>
                <Select value={newMethod} onValueChange={setNewMethod}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="card">카드</SelectItem><SelectItem value="cash">현금</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-blue-600 h-12 text-lg font-bold" onClick={handleHistorySave}>저장하기</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* [3. 내역 테이블] */}
      <Tabs defaultValue="history">
        <TabsList className="bg-slate-200"><TabsTrigger value="history" className="px-6">방문 히스토리</TabsTrigger></TabsList>
        <TabsContent value="history" className="mt-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px] text-xs font-bold text-slate-500">날짜</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">메뉴명</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500">금액</TableHead>
                  <TableHead className="w-[90px] text-right text-xs font-bold text-slate-500">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.filter(h => h.menu.toLowerCase().includes(historySearch.toLowerCase())).map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-xs text-slate-400 font-medium">{item.date}</TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input value={editMenu} onChange={(e)=>setEditMenu(e.target.value)} className="h-8 text-xs" />
                      ) : (
                        <span className="text-sm font-bold text-blue-700 cursor-pointer hover:underline" onClick={() => { setEditingId(item.id); setEditMenu(item.menu); setEditPrice(item.price.toString()); }}>
                          {item.menu}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? (
                        <Input type="number" value={editPrice} onChange={(e)=>setEditPrice(e.target.value)} className="h-8 text-xs text-right w-24 ml-auto" />
                      ) : (
                        <span className="text-sm font-black text-slate-700">{Number(item.price).toLocaleString()}원</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" className="h-7 px-2 text-[10px] bg-blue-600" onClick={() => handleUpdate(item.id)}>저장</Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => setEditingId(null)}>취소</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && <TableRow><TableCell colSpan={4} className="text-center p-16 text-slate-400">데이터가 없습니다.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}