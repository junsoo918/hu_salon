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
  DialogTitle 
} from "@/components/ui/dialog"
import { Search, UserPlus, Trash2, ImageIcon, Loader2, User, Pencil } from "lucide-react"

export default function UltraSharpCRM() {
  const [searchName, setSearchName] = useState("")
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
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

  const handleDelete = async () => {
    if (!customer || !confirm(`${customer.name} 고객 정보를 삭제할까요?`)) return;
    setLoading(true);
    const { error } = await supabase.from('customers').delete().eq('id', customer.id);
    if (!error) { alert("삭제되었습니다."); setCustomer(null); setSearchName(""); }
    setLoading(false);
  };

  const handleSave = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target.files?.[0];
    if (!newName.trim()) return alert("이름을 입력해주세요.");
    setUploading(true);
    try {
      let imageUrl = customer?.image_url;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `customer_photos/${fileName}`;
        await supabase.storage.from('avatars').upload(filePath, file);
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
      if (isEditMode && customer) {
        const { data, error } = await supabase.from('customers').update({ name: newName.trim(), phone: newPhone, image_url: imageUrl }).eq('id', customer.id).select().single();
        if (error) throw error;
        setCustomer(data); alert("수정되었습니다.");
      } else {
        if (!file) throw new Error("사진을 선택해야 합니다.");
        const { data, error } = await supabase.from('customers').insert([{ name: newName.trim(), phone: newPhone, image_url: imageUrl }]).select().single();
        if (error) throw error;
        setCustomer(data); alert("등록되었습니다.");
      }
      setIsDialogOpen(false);
    } catch (err: any) { alert(err.message); } finally { setUploading(false); }
  };

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').eq('name', searchName.trim()).maybeSingle();
    if (data) setCustomer(data);
    else alert("결과가 없습니다.");
    setLoading(false);
  };

  const handleStart = (clientX: number, clientY: number) => { if (scale > 1) { setIsDragging(true); setStartPos({ x: clientX - position.x, y: clientY - position.y }); } };
  const handleMove = (clientX: number, clientY: number) => { if (isDragging && scale > 1) setPosition({ x: clientX - startPos.x, y: clientY - startPos.y }); };
  const handleWheel = (e: React.WheelEvent) => { const zoomStep = scale * 0.12; const delta = e.deltaY < 0 ? zoomStep : -zoomStep; setScale(Math.min(Math.max(1, scale + delta), 15)); };
  const handleTouchStart = (e: React.TouchEvent) => { if (e.touches.length === 1) handleStart(e.touches[0].clientX, e.touches[0].clientY); else if (e.touches.length === 2) { setIsDragging(false); setInitialDistance(Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)); } };
  const handleTouchMove = (e: React.TouchEvent) => { if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY); else if (e.touches.length === 2 && initialDistance !== null) { const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); setScale(Math.min(Math.max(1, scale * (currentDist / initialDistance)), 15)); setInitialDistance(currentDist); } };

  return (
    <main className="fixed inset-0 flex flex-col h-[100dvh] w-full bg-slate-50 overflow-hidden select-none">
      <header className="bg-white border-b border-slate-200 z-30 shadow-sm shrink-0 px-2 py-2 flex items-center justify-between h-14 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-1">
          <Button onClick={() => { setIsEditMode(false); setNewName(""); setNewPhone(""); setIsDialogOpen(true); }} size="sm" className="bg-blue-600 font-bold h-9 px-2.5 rounded-lg shrink-0">
            <UserPlus className="w-4 h-4 text-white" />
          </Button>

          {customer && (
            <div className="flex items-center gap-2 bg-blue-50 px-2 h-9 rounded-lg border border-blue-100 flex-1 min-w-0">
              <span className="font-extrabold text-slate-800 text-sm truncate">{customer.name}</span>
              <div className="flex items-center gap-0.5 ml-auto">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500" onClick={() => { setIsEditMode(true); setNewName(customer.name); setNewPhone(customer.phone); setIsDialogOpen(true); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={handleDelete}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Input placeholder="이름" value={searchName} onChange={(e)=>setSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="h-9 border-slate-200 w-[90px] text-center font-bold" />
          <Button onClick={handleSearch} disabled={loading} className="bg-slate-800 h-9 w-9 p-0 rounded-lg">
            {loading ? <Loader2 className="animate-spin w-4 h-4 text-white" /> : <Search className="w-4 h-4 text-white" />}
          </Button>
        </div>
      </header>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[92vw] max-w-[400px] rounded-2xl p-6">
          <div className="space-y-4 py-4">
            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">이름</Label><Input value={newName} onChange={(e)=>setNewName(e.target.value)} className="text-base" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-500">연락처</Label><Input value={newPhone} onChange={(e)=>setNewPhone(e.target.value)} className="text-base" /></div>
            <div className="pt-2">
              <Input type="file" accept="image/*" onChange={handleSave} className="hidden" id="file-up" />
              <Label htmlFor="file-up" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 rounded-xl cursor-pointer bg-slate-50 text-slate-400">
                {uploading ? <Loader2 className="animate-spin" /> : <><ImageIcon className="mb-2" /><span className="text-xs">{isEditMode ? "사진 변경 (선택)" : "사진 선택 (필수)"}</span></>}
              </Label>
            </div>
            {isEditMode && <Button onClick={() => handleSave()} className="w-full bg-blue-600 font-bold h-12 rounded-xl mt-2" disabled={uploading}>수정 완료</Button>}
          </div>
        </DialogContent>
      </Dialog>

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
          <div className="w-full h-full flex items-center justify-center relative pointer-events-none overflow-hidden">
            <img 
              src={customer.image_url} 
              alt="customer" 
              onDragStart={(e) => e.preventDefault()}
              className="max-h-full max-w-full object-contain pointer-events-auto cursor-move"
              style={{ 
                /* --- 아이폰 사파리 화질 깨짐 방지 핵심 설정 --- */
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                imageRendering: '-webkit-optimize-contrast', // 대비를 통한 선명도 향상
                WebkitBackfaceVisibility: 'hidden',           // 깜빡임 방지
                WebkitPerspective: '1000',                     // 3D 가속 유도
                WebkitTransformStyle: 'preserve-3d',           // 고해상도 유지 강제
                willChange: 'transform'                        // 성능 최적화
              }}
            />
            <div className="absolute bottom-8 right-5 z-20 pointer-events-auto">
              <Button onClick={resetZoom} className="bg-blue-600 text-white shadow-xl h-10 px-6 rounded-2xl text-[14px] font-black">화면 리셋</Button>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 flex flex-col items-center gap-3"><User className="w-14 h-14 opacity-20" /><p className="text-xs font-bold uppercase tracking-widest">Search Customer</p></div>
        )}
      </section>
    </main>
  );
}