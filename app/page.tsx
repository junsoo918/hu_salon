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

export default function IntegratedZoomCRM() {
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
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  useEffect(() => { resetZoom(); }, [customer]);
  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); setIsDragging(false); };

  // --- [공통] 시작 로직 (마우스 & 터치) ---
  const handleStart = (clientX: number, clientY: number) => {
    if (scale > 1) {
      setIsDragging(true);
      // 현재 위치에서 마우스/손가락 좌표를 뺀 값을 저장 (오프셋 유지)
      setStartPos({ x: clientX - position.x, y: clientY - position.y });
    }
  };

  // --- [공통] 이동 로직 (마우스 & 터치) ---
  const handleMove = (clientX: number, clientY: number) => {
    if (isDragging && scale > 1) {
      setPosition({ x: clientX - startPos.x, y: clientY - startPos.y });
    }
  };

  // --- [PC] 휠 줌 ---
  const handleWheel = (e: React.WheelEvent) => {
    const zoomStep = scale * 0.12;
    const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
    setScale(Math.min(Math.max(1, scale + delta), 15));
  };

  // --- [모바일] 터치 전용 (핀치 줌 포함) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      setIsDragging(false); // 핀치 줌 할 때는 드래그 중단
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setInitialDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && initialDistance !== null) {
      const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const zoomFactor = currentDist / initialDistance;
      setScale(Math.min(Math.max(1, scale * zoomFactor), 15));
      setInitialDistance(currentDist);
    }
  };

  // --- 검색/등록 로직 생략 없이 유지 ---
  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').eq('name', searchName.trim()).maybeSingle();
    if (data) setCustomer(data);
    else alert("결과가 없습니다.");
    setLoading(false);
  };

  const handleRegister = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!newName.trim() || !file) return alert("정보를 확인해주세요.");
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `customer_photos/${fileName}`;
      await supabase.storage.from('avatars').upload(filePath, file);
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { data, error } = await supabase.from('customers').insert([{ name: newName.trim(), phone: newPhone, image_url: urlData.publicUrl }]).select().single();
      if (error) throw error;
      setIsDialogOpen(false); setNewName(""); setNewPhone("");
      if (data) setCustomer(data);
    } catch (err: any) { alert(err.message); } finally { setUploading(false); }
  };

  return (
    <main className="fixed inset-0 flex flex-col h-[100dvh] w-full bg-slate-50 overflow-hidden select-none">
      <header className="bg-white border-b border-slate-200 z-30 shadow-sm shrink-0 px-2 py-2 flex items-center justify-between h-14 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-1">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 font-bold h-9 px-2.5 rounded-lg shrink-0"><UserPlus className="w-4 h-4 text-white" /></Button>
            </DialogTrigger>
            <DialogContent className="w-[92vw] max-w-[400px] rounded-2xl p-6">
              <DialogHeader><DialogTitle className="text-lg font-bold">고객 등록</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">이름</Label><Input value={newName} onChange={(e)=>setNewName(e.target.value)} className="text-base" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">연락처</Label><Input value={newPhone} onChange={(e)=>setNewPhone(e.target.value)} className="text-base" /></div>
                <div className="pt-2">
                  <Input type="file" accept="image/*" onChange={handleRegister} className="hidden" id="file-up" />
                  <Label htmlFor="file-up" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 rounded-xl cursor-pointer bg-slate-50 text-slate-400">
                    {uploading ? <Loader2 className="animate-spin" /> : <><ImageIcon className="mb-2" /><span className="text-xs">사진 선택 시 자동 등록</span></>}
                  </Label>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {customer && (
            <div className="flex items-center gap-3 bg-blue-50 px-3 h-9 rounded-lg border border-blue-100 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-slate-800 text-base whitespace-nowrap">{customer.name}</span>
                <span className="text-[11px] text-blue-600 font-bold truncate">{customer.phone}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 ml-auto" onClick={() => setCustomer(null)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Input placeholder="이름" value={searchName} onChange={(e)=>setSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="h-9 border-slate-200 w-[100px] text-center font-bold" />
          <Button onClick={handleSearch} disabled={loading} className="bg-slate-800 h-9 w-9 p-0 rounded-lg">
            {loading ? <Loader2 className="animate-spin w-4 h-4 text-white" /> : <Search className="w-4 h-4 text-white" />}
          </Button>
        </div>
      </header>

      {/* 이미지 영역: 마우스와 터치 이벤트를 모두 연결 */}
      <section 
        className="flex-1 relative bg-slate-200 flex items-center justify-center overflow-hidden touch-none"
        onWheel={handleWheel}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { setIsDragging(false); setInitialDistance(null); }}
      >
        {customer ? (
          <div className="w-full h-full flex items-center justify-center relative pointer-events-none">
            <img 
              src={customer.image_url} 
              alt="customer" 
              // 브라우저 기본 드래그 방지 (중요!)
              onDragStart={(e) => e.preventDefault()}
              className="max-h-full max-w-full object-contain pointer-events-auto cursor-move"
              style={{ 
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                imageRendering: 'auto',
                WebkitBackfaceVisibility: 'hidden',
                willChange: 'transform'
              }}
            />
            <div className="absolute bottom-8 right-5 z-20 pointer-events-auto">
              <Button onClick={resetZoom} className="bg-blue-600 text-white shadow-xl h-10 px-6 rounded-2xl text-[14px] font-black active:scale-95 transition-transform">화면 리셋</Button>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 flex flex-col items-center gap-3"><User className="w-14 h-14 opacity-20" /><p className="text-xs font-bold uppercase tracking-widest">Search Customer</p></div>
        )}
      </section>
    </main>
  );
}