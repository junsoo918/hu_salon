"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Search, UserPlus, Trash2, ImageIcon, Loader2, RotateCcw, RefreshCw, Phone } from "lucide-react"

export default function ResponsivePhotoCRM() {
  const [searchName, setSearchName] = useState("")
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [uploading, setUploading] = useState(false)

  // --- 줌/이동 상태 ---
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => { resetZoom(); }, [customer]);
  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  // 마우스/터치 이벤트 공통 처리
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = 0.1;
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    setScale(Math.min(Math.max(1, scale + delta), 5));
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: clientX - position.x, y: clientY - position.y });
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (isDragging && scale > 1) {
      setPosition({ x: clientX - startPos.x, y: clientY - startPos.y });
    }
  };

  const handleEnd = () => setIsDragging(false);

  // --- 데이터 처리 (이전과 동일) ---
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `customer_photos/${fileName}`
    await supabase.storage.from('avatars').upload(filePath, file)
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleRegister = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!newName.trim() || !file) return alert("정보를 확인해주세요.")
    setUploading(true)
    try {
      const url = await uploadImage(file)
      const { data, error } = await supabase.from('customers').insert([
        { name: newName.trim(), phone: newPhone, image_url: url }
      ]).select().single()
      if (error) throw error
      setIsDialogOpen(false); setNewName(""); setNewPhone("");
      if (data) setCustomer(data);
    } catch (err: any) { alert(err.message) } finally { setUploading(false) }
  };

  const handleSearch = async () => {
    if (!searchName.trim()) return
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').eq('name', searchName.trim()).maybeSingle()
    if (data) setCustomer(data)
    else alert("결과가 없습니다.")
    setLoading(false)
  };

  return (
    <main className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      
      {/* 상단바: 모바일에서는 세로로 쌓이거나 간격 조절 */}
      <header className="flex flex-col md:flex-row items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-white border-b border-slate-200 z-30 shadow-sm gap-3">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <h1 className="text-lg md:text-xl font-black text-blue-600 flex items-center gap-2 shrink-0">
            <ImageIcon className="w-5 h-5 md:w-6 md:h-6" /> PHOTO CRM
          </h1>
          {/* 모바일에서만 보이는 등록 버튼 */}
          <div className="md:hidden">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 font-bold h-9 rounded-lg"><UserPlus className="w-4 h-4" /></Button>
              </DialogTrigger>
              <DialogContent className="w-[90%] rounded-2xl mx-auto"><DialogHeader><DialogTitle>등록</DialogTitle></DialogHeader>
                {/* 등록 폼 내용 동일 */}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-80">
          <Input 
            placeholder="이름 검색" 
            value={searchName} 
            onChange={(e)=>setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-10 border-slate-200 flex-1"
          />
          <Button onClick={handleSearch} disabled={loading} className="bg-slate-800 h-10 px-4">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* PC에서만 보이는 등록 버튼 및 정보 */}
        <div className="hidden md:flex items-center gap-4">
          {customer && (
            <div className="flex items-center gap-3 mr-4 border-r border-slate-200 pr-4">
              <span className="font-bold text-slate-800">{customer.name}</span>
              <span className="text-sm text-slate-500">{customer.phone}</span>
            </div>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 font-bold px-5">
                <UserPlus className="w-4 h-4 mr-2" /> 신규 고객 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
               <DialogHeader><DialogTitle>신규 고객 등록</DialogTitle></DialogHeader>
               <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>고객명</Label><Input value={newName} onChange={(e)=>setNewName(e.target.value)} /></div>
                <div className="space-y-2"><Label>연락처</Label><Input value={newPhone} onChange={(e)=>setNewPhone(e.target.value)} /></div>
                <div className="pt-2">
                  <Input type="file" accept="image/*" onChange={handleRegister} className="hidden" id="res-upload" />
                  <Label htmlFor="res-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 rounded-xl cursor-pointer text-slate-400">
                    <ImageIcon className="mb-2" /> 사진 선택
                  </Label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 메인 사진 영역 (모바일/PC 공통 줌 제어) */}
      <section className="flex-1 relative bg-slate-200 flex items-center justify-center overflow-hidden touch-none">
        {customer ? (
          <div 
            className="w-full h-full flex items-center justify-center"
            onWheel={handleWheel}
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleEnd}
          >
            <img 
              src={customer.image_url} 
              alt="customer" 
              draggable={false}
              className="max-h-full max-w-full transition-transform duration-75 select-none shadow-lg"
              style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}
            />

            {/* 모바일 정보 표시 (사진 하단 오버레이) */}
            <div className="md:hidden absolute bottom-20 left-4 right-4 bg-white/80 backdrop-blur p-3 rounded-xl shadow-lg border border-white/20 pointer-events-none">
              <p className="font-black text-slate-900">{customer.name}</p>
              <p className="text-xs text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</p>
            </div>

            <div className="absolute bottom-6 right-6 flex gap-2">
              {scale > 1 && (
                <Button onClick={resetZoom} variant="secondary" size="sm" className="font-bold shadow-md h-10 rounded-lg">
                  <RotateCcw className="w-4 h-4 mr-2" /> 리셋
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-slate-400 flex flex-col items-center gap-2">
            <ImageIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm">고객을 검색해 주세요.</p>
          </div>
        )}
      </section>
    </main>
  )
}