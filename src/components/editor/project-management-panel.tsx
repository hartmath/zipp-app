"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { 
  FolderOpen, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Edit3,
  Plus,
  Clock,
  Settings,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getProjectStorageService,
  Project,
  ProjectStorageResult
} from "@/lib/project-storage"

interface ProjectManagementPanelProps {
  onProjectLoad?: (project: Project) => void
  onProjectSave?: () => Project
  currentProject?: Project | null
}

export function ProjectManagementPanel({ 
  onProjectLoad, 
  onProjectSave,
  currentProject
}: ProjectManagementPanelProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [showNewProject, setShowNewProject] = useState(false)

  const projectStorageService = getProjectStorageService()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const result = await projectStorageService.listProjects()
      
      if (result.success && result.data) {
        setProjects(result.data)
      } else {
        console.error('Failed to load projects:', result.error)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProject = async () => {
    if (!onProjectSave) return

    try {
      setSaving(true)
      const projectData = onProjectSave()
      
      const result = await projectStorageService.saveProject(projectData)
      
      if (result.success) {
        alert('Project saved successfully!')
        loadProjects()
      } else {
        alert(`Failed to save project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Failed to save project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLoadProject = async (projectId: string) => {
    try {
      setLoading(true)
      const result = await projectStorageService.loadProject(projectId)
      
      if (result.success && result.data) {
        onProjectLoad?.(result.data)
        alert('Project loaded successfully!')
      } else {
        alert(`Failed to load project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error loading project:', error)
      alert('Failed to load project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const result = await projectStorageService.deleteProject(projectId)
      
      if (result.success) {
        alert('Project deleted successfully!')
        loadProjects()
      } else {
        alert(`Failed to delete project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  const handleExportProject = async (projectId: string) => {
    try {
      const result = await projectStorageService.exportProject(projectId)
      
      if (result.success) {
        alert('Project exported successfully!')
      } else {
        alert(`Failed to export project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error exporting project:', error)
      alert('Failed to export project. Please try again.')
    }
  }

  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const result = await projectStorageService.importProject(file)
      
      if (result.success) {
        alert('Project imported successfully!')
        loadProjects()
      } else {
        alert(`Failed to import project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error importing project:', error)
      alert('Failed to import project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project.id)
    setEditName(project.name)
  }

  const handleSaveEdit = async (projectId: string) => {
    try {
      const result = await projectStorageService.updateProject(projectId, {
        name: editName
      })
      
      if (result.success) {
        setEditingProject(null)
        setEditName("")
        loadProjects()
      } else {
        alert(`Failed to update project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project. Please try again.')
    }
  }

  const handleCreateNewProject = async () => {
    if (!newProjectName.trim()) return

    try {
      setSaving(true)
      const projectData = {
        name: newProjectName,
        description: '',
        duration: 60,
        fps: 30,
        canvasSize: { width: 1080, height: 1920 },
        timelineElements: [],
        mediaFiles: [],
        settings: {
          quality: 'medium' as const,
          format: 'mp4' as const,
          includeAudio: true
        }
      }
      
      const result = await projectStorageService.saveProject(projectData)
      
      if (result.success) {
        setNewProjectName("")
        setShowNewProject(false)
        loadProjects()
        alert('New project created successfully!')
      } else {
        alert(`Failed to create project: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Projects</h3>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".zipplign"
              onChange={handleImportProject}
              className="hidden"
              id="import-project"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-project')?.click()}
              className="h-8"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewProject(true)}
              className="h-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveProject}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Current
              </>
            )}
          </Button>
        </div>
      </div>

      {/* New Project Form */}
      {showNewProject && (
        <div className="p-3 border-b border-gray-700">
          <div className="space-y-2">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="h-8"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateNewProject}
                disabled={!newProjectName.trim() || saving}
                className="h-6 text-xs"
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowNewProject(false)
                  setNewProjectName("")
                }}
                className="h-6 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      <ScrollArea className="flex-1 p-3">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p className="text-sm">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <FolderOpen className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No projects yet</p>
            <p className="text-xs">Create a new project to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "p-3 bg-gray-800 rounded border border-gray-700",
                  currentProject?.id === project.id && "border-blue-500 bg-blue-900/20"
                )}
              >
                {editingProject === project.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-6 text-xs"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(project.id)}
                        className="h-5 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProject(null)}
                        className="h-5 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm text-white font-medium">{project.name}</h4>
                        <p className="text-xs text-gray-400">
                          {formatDate(project.updatedAt)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {project.timelineElements.length} elements • {Math.round(project.duration)}s
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoadProject(project.id)}
                          className="h-6 w-6 p-0"
                        >
                          <FolderOpen className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProject(project)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportProject(project.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
