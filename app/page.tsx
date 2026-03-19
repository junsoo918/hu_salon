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
import { Search, UserPlus, Trash2, ImageIcon, Loader2, User } from "lucide-react"

export default function PerfectFinalCRM() {
  const [searchName, setSearchName] = useState("")
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [uploading, setUploading] = useState(false)
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => { resetZoom(); }, [customer]);
  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  // 휠 확대/축소 로직
  const handleWheel = (e: React.WheelEvent) => {
    const zoomStep = 0.2;
    const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
    const newScale = Math.min(Math.max(1, scale + delta), 10);
    setScale(newScale);
  };

  // 드래그 시작
  const handleStart = (clientX: number, clientY: number) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: clientX - position.x, y: clientY - position.y });
    }
  };

  // 드래그 중
  const handleMove = (clientX: number, clientY: number) => {
    if (isDragging && scale > 1) {
      setPosition({ x: clientX - startPos.x, y: clientY - startPos.y });
    }
  };

  // 고객 검색
  const handleSearch = async () => {
    if (!searchName.trim()) return
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').eq('name', searchName.trim()).maybeSingle()
    if (data) setCustomer(data)
    else alert("결과가 없습니다.")
    setLoading(false)
  };

  // 이미지 업로드 로직
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `customer_photos/${fileName}`
    await supabase.storage.from('avatars').upload(filePath, file)
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  }

  // 고객 등록 로직
  const handleRegister = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!newName.trim() || !file) return alert("이름과 사진을 확인해주세요.")
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

  return (
    <main className="fixed inset-0 flex flex-col h-[100dvh] w-full bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 z-30 shadow-sm shrink-0 px-2 py-2 flex items-center justify-between h-14 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-1">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 font-bold h-9 px-2.5 rounded-lg shrink-0">
                <UserPlus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[92vw] max-w-[400px] rounded-2xl p-5">
              {/* 접근성 에러 해결: DialogTitle 추가 */}
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">고객 등록</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1"><Label className="text-xs font-bold text-slate-500">이름</Label><Input value={newName} onChange={(e)=>setNewName(e.target.value)} className="text-base" /></div>
                <div className="space-y-1"><Label className="text-xs font-bold text-slate-500">연락처</Label><Input value={newPhone} onChange={(e)=>setNewPhone(e.target.value)} className="text-base" /></div>
                <div className="pt-2">
                  <Input type="file" accept="image/*" onChange={handleRegister} className="hidden" id="file-up" />
                  <Label htmlFor="file-up" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 rounded-xl cursor-pointer bg-slate-50 text-slate-400">
                    {uploading ? <Loader2 className="animate-spin" /> : <><ImageIcon className="mb-1" /><span className="text-xs">사진 선택 시 자동 등록</span></>}
                  </Label>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {customer && (
            <div className="flex items-center gap-3 bg-blue-50 px-3 h-9 rounded-lg border border-blue-100 flex-1 min-w-0 overflow-hidden animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-slate-800 text-base whitespace-nowrap shrink-0">{customer.name}</span>
                <span className="text-[12px] text-blue-600 font-bold whitespace-nowrap truncate">{customer.phone}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 ml-auto shrink-0" onClick={() => setCustomer(null)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Input 
            placeholder="이름" 
            value={searchName} 
            onChange={(e)=>setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-9 border-slate-200 bg-slate-50 w-[100px] md:w-[130px] px-2 text-base focus:ring-blue-600 text-center font-bold shrink-0"
          />
          <Button onClick={handleSearch} disabled={loading} className="bg-slate-800 h-9 w-9 p-0 rounded-lg shrink-0">
            {loading ? <Loader2 className="animate-spin w-4 h-4 text-white" /> : <Search className="w-4 h-4 text-white" />}
          </Button>
        </div>
      </header>

      <section className="flex-1 relative bg-slate-200 flex items-center justify-center overflow-hidden touch-none w-full" onWheel={handleWheel}>
        {customer ? (
          <div 
            className="w-full h-full flex items-center justify-center relative overflow-hidden"
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={() => setIsDragging(false)}
          >
            <img 
              src={customer.image_url} 
              alt="customer" 
              draggable={false}
              className="max-h-full max-w-full object-contain select-none shadow-lg"
              style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                imageRendering: 'auto', 
                WebkitBackfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d'
              }}
            />
            <div className="absolute bottom-8 right-5 z-20">
              <Button 
                onClick={resetZoom} 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md h-9 px-5 rounded-2xl text-[13px] font-bold tracking-tight transition-transform active:scale-95"
              >
                화면 리셋
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 flex flex-col items-center gap-3">
            <User className="w-14 h-14 opacity-20" />
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">고객 검색</p>
          </div>
        )}
      </section>
    </main>
  )
}