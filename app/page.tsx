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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  UserPlus,
  Trash2,
  ImageIcon,
  Loader2,
  User,
  Pencil,
  ChevronRight,
  X,
  Maximize2,
} from "lucide-react";

export default function UltraSharpCRM() {
  const [searchName, setSearchName] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [duplicateList, setDuplicateList] = useState<any[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // 원본 확대 팝업용

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [uploading, setUploading] = useState(false);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  useEffect(() => {
    resetZoom();
  }, [customer]);
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    let result = "";
    if (value.length < 4) result = value;
    else if (value.length < 7)
      result = value.substr(0, 3) + "-" + value.substr(3);
    else if (value.length < 11)
      result =
        value.substr(0, 3) + "-" + value.substr(3, 3) + "-" + value.substr(6);
    else
      result =
        value.substr(0, 3) +
        "-" +
        value.substr(3, 4) +
        "-" +
        value.substr(7, 4);
    setNewPhone(result);
  };

  const handleDelete = async () => {
    if (!customer || !confirm(`${customer.name} 고객 정보를 삭제할까요?`))
      return;
    setLoading(true);
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id);
    if (!error) {
      alert("삭제되었습니다.");
      setCustomer(null);
      setSearchName("");
    }
    setLoading(false);
  };

  // ✅ 모바일 화질 저하 방지 로직이 추가된 저장 함수
  const handleSave = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target.files?.[0];
    if (!newName.trim()) return alert("이름을 입력해주세요.");
    setUploading(true);
    try {
      let imageUrl = customer?.image_url;
      if (file) {
        // 1. 이미지 비트맵 생성 (원본 픽셀 데이터 추출)
        const imageBitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(imageBitmap, 0, 0);

        // 2. 최고 품질(1.0)로 압축 방지 처리하여 Blob 생성
        const blob: Blob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 1.0);
        });

        const fileName = `${Date.now()}.jpg`;
        const filePath = `customer_photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, blob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      if (isEditMode && customer) {
        const { data, error } = await supabase
          .from("customers")
          .update({
            name: newName.trim(),
            phone: newPhone,
            image_url: imageUrl,
          })
          .eq("id", customer.id)
          .select()
          .single();
        if (error) throw error;
        setCustomer(data);
        alert("수정되었습니다.");
      } else {
        if (!file) throw new Error("사진을 선택해야 합니다.");
        const { data, error } = await supabase
          .from("customers")
          .insert([
            { name: newName.trim(), phone: newPhone, image_url: imageUrl },
          ])
          .select()
          .single();
        if (error) throw error;
        setCustomer(data);
        alert("등록되었습니다.");
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("name", searchName.trim());
    setLoading(false);
    if (error || !data || data.length === 0) {
      alert("결과가 없습니다.");
      return;
    }
    if (data.length === 1) {
      setCustomer(data[0]);
    } else {
      setDuplicateList(data);
      setIsSelectOpen(true);
    }
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: clientX - position.x, y: clientY - position.y });
    }
  };
  const handleMove = (clientX: number, clientY: number) => {
    if (isDragging && scale > 1)
      setPosition({ x: clientX - startPos.x, y: clientY - startPos.y });
  };
  const handleWheel = (e: React.WheelEvent) => {
    const zoomStep = scale * 0.12;
    const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
    setScale(Math.min(Math.max(1, scale + delta), 15));
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1)
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    else if (e.touches.length === 2) {
      setIsDragging(false);
      setInitialDistance(
        Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        ),
      );
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1)
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    else if (e.touches.length === 2 && initialDistance !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      setScale(
        Math.min(Math.max(1, scale * (currentDist / initialDistance)), 15),
      );
      setInitialDistance(currentDist);
    }
  };

  return (
    <main className="fixed inset-0 flex flex-col h-[100dvh] w-full bg-slate-50 overflow-hidden select-none">
      <header className="bg-white border-b border-slate-200 z-30 shadow-sm shrink-0 px-2 py-2 flex items-center justify-between h-14 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-1">
          <Button
            onClick={() => {
              setIsEditMode(false);
              setNewName("");
              setNewPhone("");
              setIsDialogOpen(true);
            }}
            size="sm"
            className="bg-blue-600 font-bold h-9 px-2.5 rounded-lg shrink-0"
          >
            <UserPlus className="w-4 h-4 text-white" />
          </Button>

          {customer && (
            <div className="flex items-center gap-2 bg-blue-50 px-2.5 h-9 rounded-lg border border-blue-100 flex-1 min-w-0">
              <div className="flex items-baseline gap-2 min-w-0 overflow-hidden">
                <span className="font-extrabold text-slate-800 text-[18px] truncate shrink-0">
                  {customer.name}
                </span>
                <span className="text-[18px] text-blue-600 font-bold truncate">
                  {customer.phone}
                </span>
              </div>
              <div className="flex items-center gap-0.5 ml-auto shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-blue-500"
                  onClick={() => {
                    setIsEditMode(true);
                    setNewName(customer.name);
                    setNewPhone(customer.phone);
                    setIsDialogOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Input
            placeholder="이름"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-9 border-slate-200 w-[90px] text-center font-bold text-[16px]"
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-slate-800 h-9 w-9 p-0 rounded-lg"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4 text-white" />
            ) : (
              <Search className="w-4 h-4 text-white" />
            )}
          </Button>
        </div>
      </header>

      {/* --- 원본 사진 팝업 모달 --- */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100dvh] p-0 border-none bg-black/95 flex flex-col items-center justify-center">
          {/* 🔍 접근성 에러 해결을 위한 코드: 화면에는 안 보이지만 스크린 리더는 읽을 수 있습니다. */}
          <DialogHeader className="sr-only">
            <DialogTitle>원본 이미지 보기</DialogTitle>
            <DialogDescription>
              고객의 원본 사진을 전체 화면으로 확인합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="absolute top-4 right-4 z-50">
            <Button
              onClick={() => setIsPreviewOpen(false)}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-full h-12 w-12 p-0"
            >
              <X className="w-8 h-8" />
            </Button>
          </div>

          <div className="w-full h-full overflow-auto flex items-center justify-center p-2">
            <img
              src={customer?.image_url}
              className="max-w-full max-h-full object-contain shadow-2xl"
              style={{ imageRendering: "-webkit-optimize-contrast" }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* --- 동명이인 선택 팝업 --- */}
      <Dialog open={isSelectOpen} onOpenChange={setIsSelectOpen}>
        <DialogContent className="w-[92vw] max-w-[400px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              고객을 선택해 주세요.
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-2 max-h-[40vh] overflow-y-auto">
            {duplicateList.map((person) => (
              <Button
                key={person.id}
                variant="outline"
                className="w-full h-14 justify-between px-4"
                onClick={() => {
                  setCustomer(person);
                  setIsSelectOpen(false);
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-slate-800">
                    {person.name}
                  </span>
                  <span className="text-sm text-slate-500">{person.phone}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- 등록/수정 팝업 --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[92vw] max-w-[400px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEditMode ? "정보 수정" : "고객 등록"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">이름</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">연락처</Label>
              <Input
                type="tel"
                value={newPhone}
                onChange={handlePhoneChange}
                placeholder="010-0000-0000"
                className="text-base"
              />
            </div>
            <div className="pt-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleSave}
                className="hidden"
                id="file-up"
              />
              <Label
                htmlFor="file-up"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 rounded-xl cursor-pointer bg-slate-50 text-slate-400"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="mb-2" />
                    <span className="text-xs">
                      {isEditMode ? "사진 변경 (선택)" : "사진 선택 (필수)"}
                    </span>
                  </>
                )}
              </Label>
            </div>
            {isEditMode && (
              <Button
                onClick={() => handleSave()}
                className="w-full bg-blue-600 font-bold h-12 rounded-xl mt-2 text-white"
                disabled={uploading}
              >
                수정 완료
              </Button>
            )}
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
        onTouchEnd={() => {
          setIsDragging(false);
          setInitialDistance(null);
        }}
      >
        {customer ? (
          <div className="w-full h-full flex items-center justify-center relative pointer-events-none overflow-hidden">
            <img
              src={customer.image_url}
              alt="customer"
              className="max-h-full max-w-full object-contain pointer-events-auto cursor-move"
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                imageRendering: "-webkit-optimize-contrast",
                WebkitBackfaceVisibility: "hidden",
                WebkitPerspective: "1000",
                WebkitTransformStyle: "preserve-3d",
                willChange: "transform",
              }}
            />

            <div className="absolute bottom-8 right-5 z-20 pointer-events-auto flex flex-col gap-2">
              <Button
                onClick={resetZoom}
                className="bg-white/90 text-slate-800 border border-slate-200 shadow-xl h-10 px-6 rounded-2xl text-[14px] font-black"
              >
                화면 리셋
              </Button>
              <Button
                onClick={() => setIsPreviewOpen(true)}
                className="bg-blue-600 text-white shadow-xl h-10 px-6 rounded-2xl text-[14px] font-black flex gap-2 items-center"
              >
                <Maximize2 className="w-4 h-4" /> 원본 확대
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 flex flex-col items-center gap-3">
            <User className="w-14 h-14 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">
              Search Customer
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
