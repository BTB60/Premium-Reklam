"use client";

import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  onFilesSelected?: (files: File[]) => void;
  className?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
}

export function FileUpload({
  accept = "image/*,.pdf,.ai,.psd,.cdr",
  maxSize = 50,
  maxFiles = 5,
  onFilesSelected,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Fayl həcmi ${maxSize}MB-dan çox ola bilməz`;
    }
    return null;
  };

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    setError(null);
    const fileArray = Array.from(newFiles);

    if (files.length + fileArray.length > maxFiles) {
      setError(`Maksimum ${maxFiles} fayl yükləyə bilərsiniz`);
      return;
    }

    const newUploadedFiles: UploadedFile[] = [];

    fileArray.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const uploadedFile: UploadedFile = {
        file,
        id: generateId(),
      };

      // Create preview for images
      if (file.type.startsWith("image/")) {
        uploadedFile.preview = URL.createObjectURL(file);
      }

      newUploadedFiles.push(uploadedFile);
    });

    const updatedFiles = [...files, ...newUploadedFiles];
    setFiles(updatedFiles);
    onFilesSelected?.(updatedFiles.map((f) => f.file));
  }, [files, maxFiles, maxSize, onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onFilesSelected?.(updatedFiles.map((f) => f.file));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-6 h-6 text-[#D90429]" />;
    }
    return <File className="w-6 h-6 text-[#D90429]" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-[18px] p-8 text-center transition-all cursor-pointer",
          isDragging
            ? "border-[#D90429] bg-[#D90429]/5"
            : "border-[#E5E7EB] bg-white hover:border-[#D90429]/50"
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="pointer-events-none">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D90429]/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-[#D90429]" />
          </div>
          <p className="font-medium text-[#1F2937] mb-1">
            Faylları bura sürükləyin və ya klikləyin
          </p>
          <p className="text-sm text-[#6B7280]">
            Maksimum {maxSize}MB, {maxFiles} fayl
          </p>
          <p className="text-xs text-[#6B7280] mt-2">
            Dəstəklənən formatlar: JPG, PNG, PDF, AI, PSD, CDR
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-[#DC2626] text-center"
        >
          {error}
        </motion.p>
      )}

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {files.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E5E7EB]"
              >
                {/* Preview or Icon */}
                {uploadedFile.preview ? (
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#D90429]/10 flex items-center justify-center">
                    {getFileIcon(uploadedFile.file)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1F2937] text-sm truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="p-2 text-[#6B7280] hover:text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
