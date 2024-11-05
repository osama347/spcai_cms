'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import Router from 'next/router'
import DynamicTable from '@/components/dynamic-table'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
const supabase = createClient()

async function fetchProjects() {
  
    
    const { data, error } = await supabase.from('projects').select()
    
    if (error) {
      return { error: error.message }
    }
  
    return { projects: data || [] }
}
  
async function addProject(formData: FormData) {
  
  
  const name = formData.get('name') as string
  const title = formData.get('title') as string
  const short_description = formData.get('description') as string
  const link = formData.get('link') as string
  const is_featured = formData.get('is_featured') === 'true'
  const is_open_source = formData.get('is_openSource') === 'true'
  const is_ours = formData.get('is_ours') === 'true'
  const research_status = formData.get('research_status') as string
  const status = formData.get('project_status') as string
  const type = formData.get('project_type') as string

  const { error } = await supabase
    .from('projects')
    .insert({ 
      name, 
      title, 
      short_description, 
      link, 
      is_featured, 
      is_open_source, 
      is_ours, 
      research_status, 
      status, 
      type 
    }).select()

  if (error) {
    return { error: error.message }
  }

  
  return { success: true }
}

async function DeleteProject  (item: Record<string, any>)  {
    
  const { error } = await supabase
  .from('projects')
  .delete()
    .eq('id', item.id)
  
      
  if (error) {
    console.error('Error deleting project:', error.message);
    return {error:error.message};
  }
  return {success:true};
};

async function updateProject(params: { column: string; value: any; conditionColumn: string; conditionValue: any }[], item: Record<string, any>) {
  const updateData: Record<string, any> = {}
  params.forEach(param => {
    updateData[param.column] = param.value
  })

  const { error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', item.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}


export default function Projects() {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    link: '',
    is_featured: false,
    is_openSource: false,
    is_ours: false,
    research_status: '',
    project_status: '',
    project_type: '',
  })

  const loadProjects = async () => {
    setIsLoading(true)
    setError(null)
    const result = await fetchProjects()
    if ('error' in result) {
      setError(result.error || null)
    } else {
      setProjects(result.projects)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

 
  const handleUpdate = async (params: { column: string; value: any; conditionColumn: string; conditionValue: any }[], item: Record<string, any>): Promise<{ success?: boolean; error?: string }> => {
    try {
      const result = await updateProject(params, item)
      if ('success' in result) {
        toast({
          title: "Success!",
          description: "Project updated successfully.",
          variant: "default",
        })
        loadProjects()
        return { success: true }
      } else {
        toast({
          title: "Failed!",
          description: result.error || "An error occurred. Please try again.",
          variant: "destructive",
        })
        return { error: result.error || "An error occurred. Please try again." }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast({
        title: "Error!",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: errorMessage }
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formDataToSubmit = new FormData()

    Object.entries(formData).forEach(([key, value]) => {
      formDataToSubmit.append(key, value.toString())
    })

    try {
      const result = await addProject(formDataToSubmit)
      if ('success' in result) {
        setIsOpen(false)
        toast({
          title: "Success!",
          description: "Project added successfully.",
          variant: "default",
        })
        loadProjects()
      } else {
        setError(result.error)
        toast({
          title: "Failed!",
          description: result.error + " Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
      toast({
        title: "Error!",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-50vh">
        <div role="status">
          <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}
      
      <div>
      <span>
        <Link href={""}
        onClick={Router.reload}
        >Reload</Link>
    </span>
      </div>
    
    </div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Add New Project</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>
                Enter the details of the new project here. Fill out all fields carefully.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="link">Project Link</Label>
                <Input id="link" name="link" type="url" value={formData.link} onChange={handleInputChange} required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="is_featured" name="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))} />
                  <Label htmlFor="is_featured">Featured Project</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_openSource" name="is_openSource" checked={formData.is_openSource} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_openSource: checked }))} />
                  <Label htmlFor="is_openSource">Open Source</Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="is_ours" name="is_ours" checked={formData.is_ours} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_ours: checked }))} />
                <Label htmlFor="is_ours">Our Project</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="research_status">Research Status</Label>
                  <Select name="research_status" value={formData.research_status} onValueChange={(value) => handleSelectChange('research_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_status">Project Status</Label>
                  <Select name="project_status" value={formData.project_status} onValueChange={(value) => handleSelectChange('project_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type</Label>
                <Select name="project_type" value={formData.project_type} onValueChange={(value) => handleSelectChange('project_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects available</p>
      ) : (
        <DynamicTable data={projects} onDelete={DeleteProject} onReload={loadProjects}/>
      )}
    </div>
  )
}