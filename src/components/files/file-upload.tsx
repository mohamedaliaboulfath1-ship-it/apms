'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadDocument, type StorageBucket } from '@/lib/actions/documents';
import { toast } from 'sonner';

interface FileUploadProps {
  bucket: StorageBucket;
  entityType: string;
  entityId: string;
  onSuccess?: () => void;
  className?: string;
}

export function FileUpload({ bucket, entityType, entityId, onSuccess, className }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.heic'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 50 * 1024 * 1024,
  });

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('entity_type', entityType);
      formData.append('entity_id', entityId);
      const result = await uploadDocument(formData);
      if (result.error) toast.error(result.error);
      else toast.success(`${file.name} uploaded`);
    }
    setFiles([]);
    setUploading(false);
    onSuccess?.();
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Drag & drop files here</p>
        <p className="text-xs text-muted-foreground">PDF, Images, Excel — max 50MB</p>
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border p-2">
              <File className="h-4 w-4" />
              <span className="flex-1 truncate text-sm">{f.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload {files.length} file(s)
          </Button>
        </div>
      )}
    </div>
  );
}
