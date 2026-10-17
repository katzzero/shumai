import { Button } from '@/ui/components/ui/button'
import { Checkbox } from '@/ui/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/components/ui/dialog'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { m } from '@/ui/paraglide/messages.js'
import { client } from '@/ui/api/client'

interface Project {
  id: string
  name: string
}

interface ProjectAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberName?: string
  teamId: string
  memberId: string
  projects: Project[]
}

export function ProjectAccessDialog({
  open,
  onOpenChange,
  memberName,
  teamId,
  memberId,
  projects,
}: ProjectAccessDialogProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [allAccess, setAllAccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    client.api.teams[':teamId'].members[':userId'].projects
      .$get({ param: { teamId, userId: memberId } })
      .then(async (res) => {
        const r = res as { ok: boolean; json: () => Promise<unknown> }
        if (!r.ok) throw new Error('Failed')
        const data = (await r.json()) as { projectIds: string[]; allAccess: boolean }
        setAllAccess(!!data.allAccess)
        setSelected(data.projectIds ?? [])
      })
      .catch(() => toast.error(m.failed_to_update_member_role()))
      .finally(() => setLoading(false))
  }, [open, teamId, memberId])

  const toggle = (projectId: string) => {
    setSelected((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await client.api.teams[':teamId'].members[':userId'].projects.$put({
        param: { teamId, userId: memberId },
        json: { projectIds: allAccess ? null : selected },
      })
      const r = res as { ok: boolean }
      if (!r.ok) throw new Error('Failed')
      toast.success(m.member_role_updated())
      onOpenChange(false)
    } catch {
      toast.error(m.failed_to_update_member_role())
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{memberName ? `${m.project_members()} - ${memberName}` : m.project_members()}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-4 text-center">Loading...</div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <Checkbox checked={allAccess} onCheckedChange={(v) => setAllAccess(!!v)} />
              <span>All projects</span>
            </label>
            {!allAccess && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2">
                    <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}