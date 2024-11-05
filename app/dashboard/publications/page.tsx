'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from "@/utils/supabase/client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { X } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { truncate } from 'fs';




async function fetchPublications() {
  const supabase = createClient()
    
    const { data, error } = await supabase.from('publications').select()
    
    if (error) {
      return { error: error.message }
    }
  
    return { publications: data || [] }
  }
  async function addPublications(formData: FormData) {
    const supabase = createClient();
    
    const title = formData.get('title') as string;
    const venue = formData.get('venue') as string;
    const type = formData.get('type') as string;
    const month = formData.get('month') as string;
    const year = formData.get('year') as string;
    const authors = JSON.parse(formData.get('authors') as string);
    const tags = JSON.parse(formData.get('tags') as string);
    const links = JSON.parse(formData.get('links') as string);
  
    // Create the desired format: "Month, Year"
    const dateFormatted = `${String(month).padStart(2, '0')}, ${year}`;

  
    const { error } = await supabase
      .from('publications')
      .insert({
        title,
        venue,
        type,
        date: dateFormatted,  // Insert formatted string "Month, Year"
        authors,
        tags,
        links
      });
  
    if (error) {
      return { error: error.message };
    }
  
    
    return { success: true };
  }

  async function DeletePublication  (item: Record<string, any>)  {
    
    const supabase= createClient()
    
   
      
    const { error } = await supabase
    .from('publications')
    .delete()
      .eq('id', item.id)
    
        
    if (error) {
      console.error('Error deleting publication:', error.message);
      return {error:error.message};
    }
    return {success:true};
  };

  async function updatePublication(params: { column: string; value: any; conditionColumn: string; conditionValue: any }[], item: Record<string, any>) {
    const supabase = createClient()
    const updateData: Record<string, any> = {}
    params.forEach(param => {
      updateData[param.column] = param.value
    })
  
    // Special handling for date
    if (updateData.month && updateData.year) {
      updateData.date = `${String(updateData.month).padStart(2, '0')}, ${updateData.year}`
      delete updateData.month
      delete updateData.year
    }
  
    const { error } = await supabase
      .from('publications')
      .update(updateData)
      .eq('id', item.id)
  
    if (error) {
      return { error: error.message }
    }
  
    return { success: true }
  }
  
export default function Publications() {
  const { toast } = useToast()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [publications, setPublications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    type: '',
    month: '',
    year: '',
    authors: [''],
    tags: [''],
    links: ['']
  })

  const loadPublications = async () => {
    setIsLoading(true)
    setError(null)
    const result = await fetchPublications()
    if ('error' in result) {
      setError(result.error || null)
    } else {
      setPublications(result.publications)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadPublications()
  }, [])
  const handleUpdate = async (params: { column: string; value: any; conditionColumn: string; conditionValue: any }[], item: Record<string, any>): Promise<{ success?: boolean; error?: string }> => {
    try {
      const result = await updatePublication(params, item)
      if ('success' in result) {
        toast({
          title: "Success!",
          description: "Publication updated successfully.",
          variant: "default",
        })
        loadPublications()
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleArrayChange = (field: 'authors' | 'tags' | 'links', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => i === index ? value : item)
    }))
  }

  const handleAddField = (field: 'authors' | 'tags' | 'links') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }))
  }

  const handleRemoveField = (field: 'authors' | 'tags' | 'links', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_: string, i: number) => i !== index)
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formDataToSubmit = new FormData()

    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formDataToSubmit.append(key, JSON.stringify(value))
      } else {
        formDataToSubmit.append(key, value.toString())
      }
    })

    try {
      const result = await addPublications(formDataToSubmit)
      if ('success' in result) {
        setIsOpen(false)
        toast({
          title: "Success!",
          description: "Publication added successfully.",
          variant: "default",
        })
        loadPublications()
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
        <Link href={''}
        onClick={Router.reload}
        >Reload</Link>
      </div>
    
    </div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Publications</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Add New Publication</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Publication</DialogTitle>
              <DialogDescription>
                Enter the details of the new publication here. Navigate through the tabs to fill out all information.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="authors">Authors</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <TabsContent value="basic">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Textarea id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venue">Venue</Label>
                        <Textarea id="venue" name="venue" value={formData.venue} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="journal">Journal</SelectItem>
                            <SelectItem value="conference">Conference</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                            <SelectItem value="preprint">Preprint</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="month">Month</Label>
                          <Select name="month" value={formData.month} onValueChange={(value) => handleSelectChange('month', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                                <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                  {month.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="year">Year</Label>
                          <Select name="year" value={formData.year} onValueChange={(value) => handleSelectChange('year', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="YYYY" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="authors">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      {formData.authors.map((author, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={author}
                            onChange={(e) => handleArrayChange('authors', index, e.target.value)}
                            placeholder="Author name"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveField('authors', index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => handleAddField('authors')}>
                        Add Author
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="tags">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      {formData.tags.map((tag, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={tag}
                            onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                            placeholder="Tag"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveField('tags', index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => handleAddField('tags')}>
                        Add Tag
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="links">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      {formData.links.map((link, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={link}
                            onChange={(e) => handleArrayChange('links', index, e.target.value)}
                            placeholder="https://"
                            type="url"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveField('links', index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => handleAddField('links')}>
                        Add Link
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Publication"}
                </Button>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      {publications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No publications available</p>
      ) : (
        <DynamicTable data={publications} onDelete={DeletePublication} onReload={loadPublications} onUpdate={handleUpdate}/>
      )}
    </div>
  )
}