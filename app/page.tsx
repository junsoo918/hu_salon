"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
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
import { Search, UserPlus, Trash2, ImageIcon, Loader2, RotateCcw, RefreshCw } from "lucide-react"

export default function PhotoViewerFull() {
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

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = 0.1;
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    setScale(Math.min(Math.max(1, scale + delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // --- 데이터 처리 로직 ---
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

  const handleSearch = async () => {
    if (!searchName.trim()) return
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').eq('name', searchName.trim()).maybeSingle()
    if (data) setCustomer(data)
    else alert("검색 결과가 없습니다.")
    setLoading(false)
  };

  const handleUpdateImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !customer) return
    setUploading(true)
    try {
      const newUrl = await uploadImage(file)
      await supabase.from('customers').update({ image_url: newUrl }).eq('id', customer.id)
      setCustomer({ ...customer, image_url: newUrl })
    } catch (err: any) { alert(err.message) } finally { setUploading(false) }
  };

  const handleDelete = async () => {
    if (!confirm(`${customer.name}님의 정보를 삭제하시겠습니까?`)) return
    await supabase.from('customers').delete().eq('id', customer.id)
    setCustomer(null); setSearchName("");
  };

  return (
    <main className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      
      {/* 상단바: 검색 및 등록 */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black text-blue-600 flex items-center gap-2">
            <ImageIcon className="w-6 h-6" /> PHOTO CRM
          </h1>
          <div className="flex gap-2 w-80">
            <Input 
              placeholder="이름 검색 후 Enter" 
              value={searchName} 
              onChange={(e)=>setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-10 border-slate-200 focus:ring-blue-500"
            />
            <Button onClick={handleSearch} disabled={loading} className="bg-slate-800">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {customer && (
            <div className="flex items-center gap-3 mr-4 border-r border-slate-200 pr-4">
              <span className="font-bold text-slate-800">{customer.name}</span>
              <span className="text-sm text-slate-500">{customer.phone}</span>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 font-bold">
                <UserPlus className="w-4 h-4 mr-2" /> 신규 고객 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader><DialogTitle>신규 고객 등록</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>고객명</Label><Input value={newName} onChange={(e)=>setNewName(e.target.value)} /></div>
                <div className="space-y-2"><Label>연락처</Label><Input value={newPhone} onChange={(e)=>setNewPhone(e.target.value)} /></div>
                <div className="pt-2">
                  <Input type="file" accept="image/*" onChange={handleRegister} className="hidden" id="full-upload" />
                  <Label htmlFor="full-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-400">
                    {uploading ? <Loader2 className="animate-spin" /> : <><ImageIcon className="mb-2" /> 사진 선택시 즉시 저장</>}
                  </Label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 하단 전체 사진 영역 */}
      <section className="flex-1 relative bg-slate-200 flex items-center justify-center overflow-hidden">
        {customer ? (
          <div 
            className="w-full h-full flex items-center justify-center cursor-move"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              src={customer.image_url} 
              alt="customer" 
              draggable={false}
              className="max-h-full max-w-full transition-transform duration-75 select-none shadow-lg"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              }}
            />

            {/* 하단 플로팅 컨트롤 */}
            <div className="absolute bottom-8 right-8 flex gap-2">
              <Input type="file" accept="image/*" onChange={handleUpdateImage} className="hidden" id="change-img" />
              <Label htmlFor="change-img" className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-50 flex items-center gap-2 shadow-md">
                <RefreshCw className="w-4 h-4" /> 사진 변경
              </Label>
              {scale > 1 && (
                <Button onClick={resetZoom} variant="secondary" className="font-bold shadow-md">
                  <RotateCcw className="w-4 h-4 mr-2" /> 리셋
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-slate-400 flex flex-col items-center gap-2">
            <ImageIcon className="w-12 h-12 opacity-20" />
            <p>고객을 검색해 주세요.</p>
          </div>
        )}
      </section>
    </main>
  )
}