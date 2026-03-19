"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  UserPlus,
  Trash2,
  ImageIcon,
  Loader2,
  RotateCcw,
  RefreshCw,
  User,
} from "lucide-react";

export default function ExtendedInfoCRM() {
  const [searchName, setSearchName] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [uploading, setUploading] = useState(false);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    resetZoom();
  }, [customer]);
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

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `customer_photos/${fileName}`;
    await supabase.storage.from("avatars").upload(filePath, file);
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleRegister = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!newName.trim() || !file) return alert("정보를 확인해주세요.");
    setUploading(true);
    try {
      const url = await uploadImage(file);
      const { data, error } = await supabase
        .from("customers")
        .insert([{ name: newName.trim(), phone: newPhone, image_url: url }])
        .select()
        .single();
      if (error) throw error;
      setIsDialogOpen(false);
      setNewName("");
      setNewPhone("");
      if (data) setCustomer(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("name", searchName.trim())
      .maybeSingle();
    if (data) setCustomer(data);
    else alert("결과가 없습니다.");
    setLoading(false);
  };

  const handleUpdateImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customer) return;
    setUploading(true);
    try {
      const newUrl = await uploadImage(file);
      await supabase
        .from("customers")
        .update({ image_url: newUrl })
        .eq("id", customer.id);
      setCustomer({ ...customer, image_url: newUrl });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`${customer.name}님의 정보를 삭제하시겠습니까?`)) return;
    await supabase.from("customers").delete().eq("id", customer.id);
    setCustomer(null);
    setSearchName("");
  };

  return (
    <main className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 z-30 shadow-sm shrink-0 px-2 md:px-4 py-2 flex items-center h-14 overflow-hidden">
        {/* 1. 왼쪽: 등록 버튼 + 고객 정보 (가로로 길게 확장) */}
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-blue-600 font-bold h-9 px-2.5 rounded-lg shadow-sm shrink-0"
              >
                <UserPlus className="w-4 h-4 md:mr-1" />
                <span className="hidden sm:inline text-xs">등록</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] max-w-[400px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>고객 등록</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 px-1">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">고객명</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">연락처</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <div className="pt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleRegister}
                    className="hidden"
                    id="res-upload"
                  />
                  <Label
                    htmlFor="res-upload"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 rounded-xl cursor-pointer text-slate-400"
                  >
                    <ImageIcon className="mb-2 text-slate-300" />{" "}
                    <span className="text-xs">사진 선택</span>
                  </Label>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {customer && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 h-9 rounded-lg border border-blue-100 min-w-0 max-w-full flex-1 animate-in fade-in slide-in-from-left-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                {/* 이름 부분 */}
                <span className="font-extrabold text-slate-800 text-sm md:text-base whitespace-nowrap">
                  {customer.name}
                </span>
                {/* 전화번호 부분 */}
                <span className="text-[12px] md:text-[13px] text-blue-600 font-bold whitespace-nowrap">
                  {customer.phone}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-slate-300 hover:text-red-500 shrink-0 ml-auto"
                onClick={handleDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* 2. 오른쪽: 검색바 (고정 너비) + 검색 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          <Input
            placeholder="이름"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-9 border-slate-200 bg-slate-50 w-[105px] md:w-[120px] px-2 text-base md:text-lg focus:ring-blue-500 text-center font-bold shrink-0"
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-slate-800 h-9 w-9 p-0 rounded-lg shrink-0"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </header>

      {/* 메인 사진 영역 */}
      <section className="flex-1 relative bg-slate-200 flex items-center justify-center overflow-hidden touch-none">
        {customer ? (
          <div
            className="w-full h-full flex items-center justify-center"
            onWheel={handleWheel}
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) =>
              handleStart(e.touches[0].clientX, e.touches[0].clientY)
            }
            onTouchMove={(e) =>
              handleMove(e.touches[0].clientX, e.touches[0].clientY)
            }
            onTouchEnd={handleEnd}
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

            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleUpdateImage}
                className="hidden"
                id="change-img"
              />
              <Label
                htmlFor="change-img"
                className="bg-white border border-slate-200 text-slate-700 h-9 px-3 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-2 shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 사진 변경
              </Label>
              {scale > 1 && (
                <Button
                  onClick={resetZoom}
                  variant="secondary"
                  className="font-bold shadow-md h-9 px-3 rounded-lg bg-white text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> 리셋
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-slate-300 flex flex-col items-center gap-1.5 opacity-40">
            <User className="w-10 h-10" />
            <p className="text-[11px] font-bold tracking-widest uppercase text-center px-4">
              고객을 검색해 주세요
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
