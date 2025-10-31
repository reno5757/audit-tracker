'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileText, FileArchive, FileType, Download } from 'lucide-react'

const BUCKET = 'audit-files'

export default function SignedFileBadge({
  kind,
  path,
  label,
}: {
  kind: 'pdf' | 'word' | 'zip'
  path?: string
  label?: string
}) {
  const supabase = createClient()
  const [isHovering, setIsHovering] = useState(false)

  const base =
    'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium truncate max-w-[15ch] transition-colors duration-150'
  const styles =
    kind === 'pdf'
      ? 'bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100'
      : kind === 'word'
      ? 'bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100'
      : 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100'

  const DefaultIcon =
    kind === 'pdf' ? FileText : kind === 'word' ? FileType : FileArchive
  const Icon = isHovering ? Download : DefaultIcon

  const text = !label ? '—' : label.length > 15 ? label.slice(0, 12) + '…' : label

  if (!path) {
    return (
      <span className={`${base} text-slate-400`} title="No file">
        -
      </span>
    )
  }

  const onClick = async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60) // 60s expiry

    if (error) {
      console.error('Signed URL error:', error.message)
      return
    }
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`${base} ${styles}`}
      title={label}
    >
      <Icon className="h-5 w-5 shrink-0 transition-transform duration-150" />
    </button>
  )
}
