import { useEffect, useState } from 'react'
import {
  createLivestockGroup,
  deleteLivestockGroup,
  listLivestockGroups,
  updateLivestockGroup,
  type LivestockGroup,
  type LivestockGroupInput,
} from './livestockGroupsApi'
import { createLivestockRecord, type LivestockRecordInput } from './livestockRecordsApi'
import LivestockGroupFormModal from './LivestockGroupFormModal'
import LivestockRecordFormModal from './LivestockRecordFormModal'
import RecordHistoryModal from './RecordHistoryModal'
import './LivestockPage.css'

function LivestockPage() {
  const [groups, setGroups] = useState<LivestockGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<LivestockGroup | null>(null)
  const [loggingRecordFor, setLoggingRecordFor] = useState<LivestockGroup | null>(null)
  const [historyFor, setHistoryFor] = useState<LivestockGroup | null>(null)
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listLivestockGroups()
      setGroups(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load livestock groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const openCreateForm = () => {
    setEditingGroup(null)
    setFormOpen(true)
  }

  const openEditForm = (group: LivestockGroup) => {
    setEditingGroup(group)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingGroup(null)
  }

  const handleSave = async (input: LivestockGroupInput) => {
    setSaving(true)
    setError(null)
    try {
      if (editingGroup) {
        await updateLivestockGroup(editingGroup.id, input)
      } else {
        await createLivestockGroup(input)
      }
      closeForm()
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save livestock group')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (group: LivestockGroup) => {
    const confirmed = window.confirm(`Delete "${group.animal_type}"? This cannot be undone.`)
    if (!confirmed) return

    setError(null)
    try {
      await deleteLivestockGroup(group.id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete livestock group')
    }
  }

  const handleLogRecord = async (input: LivestockRecordInput) => {
    setSaving(true)
    setError(null)
    try {
      await createLivestockRecord(input)
      setLoggingRecordFor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log record')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="livestock-page">
      <div className="livestock-header">
        <h1>Livestock/Poultry Management</h1>
        <button type="button" className="btn-primary" onClick={openCreateForm}>
          + Add Group
        </button>
      </div>

      {error && <p className="livestock-error">{error}</p>}

      {loading ? (
        <p className="livestock-empty">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="livestock-empty">No livestock groups yet. Add one to get started.</p>
      ) : (
        <div className="livestock-grid">
          {groups.map((group) => (
            <div className="livestock-card" key={group.id}>
              <h2>{group.animal_type}</h2>
              <p className="livestock-count">{group.count} head</p>
              {group.notes && <p>{group.notes}</p>}

              <div className="livestock-card-actions">
                <button type="button" onClick={() => setLoggingRecordFor(group)}>
                  Log Record
                </button>
                <button type="button" onClick={() => setHistoryFor(group)}>
                  History
                </button>
                <button type="button" onClick={() => openEditForm(group)}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(group)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <LivestockGroupFormModal
          initialValue={editingGroup}
          saving={saving}
          onCancel={closeForm}
          onSave={handleSave}
        />
      )}

      {loggingRecordFor && (
        <LivestockRecordFormModal
          group={loggingRecordFor}
          saving={saving}
          onCancel={() => setLoggingRecordFor(null)}
          onSave={handleLogRecord}
        />
      )}

      {historyFor && <RecordHistoryModal group={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  )
}

export default LivestockPage
