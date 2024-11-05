'use client'

import { useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { createClient } from '@/utils/supabase/client'
import DynamicTable from '@/components/dynamic-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
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
import { useToast } from "@/hooks/use-toast"
import { X } from 'lucide-react'


const supabase = createClient()

async function fetchMembers() {
  const { data, error } = await supabase.from('members').select()
    
  if (error) {
    return { error: error.message }
  }
  
  return { members: data || [] }
}

async function addMember(formData: FormData) {
  const name = formData.get('name') as string
  const title = formData.get('title') as string
  const advisor = formData.get('advisor') as string
  const email = formData.get('email') as string
  const github = formData.get('github') as string
  const linkedin = formData.get('linkedin') as string
  const scholar = formData.get('scholar') as string
  const twitter = formData.get('twitter') as string
  const website = formData.get('website') as string
  const type = formData.get('type') as string
  

  // Handle interests
  const interests = Array.from(formData.entries())
    .filter(([key]) => key.startsWith('interest-'))
    .map(([, value]) => value as string)
    .filter(Boolean)

  // Handle image upload
  const imageFile = formData.get('image') as File
  let imageUrl = null

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `member/${nanoid()}.${fileExt}`
    const { data, error: uploadError } = await supabase.storage
      .from('spcai_images')
      .upload(fileName, imageFile)

    if (uploadError) {
      return { error: uploadError.message }
    }

    // Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('spcai_images')
      .getPublicUrl(fileName)

    imageUrl = publicUrlData.publicUrl
  }

  const { error } = await supabase
    .from('members')
    .insert({
      name,
      title,
      advisor,
      email,
      image: imageUrl,
      github,
      linkedin,
      scholar,
      twitter,
      website,
      research_interests: interests,
      type
    })
    .select()
 
  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

async function deleteMember(item: Record<string, any>) {
  // First, delete the image if it exists
  if (item.image) {
    const filePathMatch = item.image.match(/\/storage\/v1\/object\/public\/spcai_images\/(.+)/)
    if (filePathMatch && filePathMatch[1]) {
      const filePath = filePathMatch[1]
      const { error: deleteImageError } = await supabase.storage
        .from('spcai_images')
        .remove([filePath])

      if (deleteImageError) {
        console.error('Error deleting image:', deleteImageError)
        return { error: 'Failed to delete image' }
      }
    }
  }

  // Then, delete the member record
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', item.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

async function updateMember(params: { column: string; value: any; conditionColumn: string; conditionValue: any }[], item: Record<string, any>) {
  const updateData: Record<string, any> = {}
  params.forEach(param => {
    updateData[param.column] = param.value
  })

  const { error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', item.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export default function Members() {
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    advisor: '',
    email: '',
    image: null as File | null,
    github: '',
    linkedin: '',
    scholar: '',
    twitter: '',
    website: '',
    interests: [''] as string[],
    type: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? e.target.files?.[0] || null : value
    }))
  }

  const loadMembers = async () => {
    setIsLoading(true)
    setError(null)
    const result = await fetchMembers()
    if ('error' in result) {
      setError(result.error || null)
    } else {
      setMembers(result.members)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const handleInterestChange = (index: number, value: string) => {
    const newInterests = [...formData.interests]
    newInterests[index] = value
    setFormData(prev => ({ ...prev, interests: newInterests }))
  }

  const handleAddInterest = () => {
    setFormData(prev => ({ ...prev, interests: [...prev.interests, ''] }))
  }

  const handleRemoveInterest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formDataToSubmit = new FormData()

    // Append all form data to FormData
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'interests' && Array.isArray(value)) {
        value.forEach((interest: string, index: number) => {
          formDataToSubmit.append(`interest-${index}`, interest)
        })
      } else if (key === 'image' && value instanceof File) {
        formDataToSubmit.append(key, value)
      } else if (typeof value === 'string') {
        formDataToSubmit.append(key, value)
      }
    })

    try {
      const result = await addMember(formDataToSubmit)
      if ('success' in result) {
        setIsOpen(false)
        toast({
          title: "Success!",
          description: "Member added successfully.",
          variant: "default",
        })
        loadMembers()
      } else {
        setError(result.error)
        toast({
          title: "Failed!",
          description: result.error || "An error occurred. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast({
        title: "Error!",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (item: Record<string, any>): Promise<{ success?: boolean; error?: string }> => {
    try {
      const result = await deleteMember(item)
      if ('success' in result) {
        toast({
          title: "Success!",
          description: "Member deleted successfully.",
          variant: "default",
        })
        loadMembers()
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

  const handleUpdate = async (params: { column: string; value: any; conditionColumn: string; conditionValue: any }[], item: Record<string, any>): Promise<{ success?: boolean; error?: string }> => {
    try {
      const result = await updateMember(params, item)
      if ('success' in result) {
        toast({
          title: "Success!",
          description: "Member updated successfully.",
          variant: "default",
        })
        loadMembers()
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-50vh">
      <div role="status">
        <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Error: {error}
        <br />
        <a 
          href="" 
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }} 
          className="text-blue-500 underline hover:text-blue-700"
        >
          Refresh
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Add New Member</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Enter the details of the new member. Navigate through the tabs to fill out all information.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="additional">Additional</TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <TabsContent value="personal">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input id="title" name="title" value={formData.title} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advisor">Advisor</Label>
                        <Input id="advisor" name="advisor" value={formData.advisor} onChange={handleInputChange} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image">Profile Image</Label>
                        <Input id="image" name="image" type="file" accept="image/*" onChange={handleInputChange} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="social">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="github">GitHub</Label>
                          <Input id="github" name="github" value={formData.github} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input id="linkedin" name="linkedin" value={formData.linkedin} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="scholar">Google Scholar</Label>
                          <Input id="scholar" name="scholar" value={formData.scholar} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter">Twitter</Label>
                          <Input id="twitter" name="twitter" value={formData.twitter} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Personal Website</Label>
                        <Input id="website" name="website" value={formData.website} onChange={handleInputChange} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="additional">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Interests</Label>
                        {formData.interests.map((interest, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={interest}
                              onChange={(e) => handleInterestChange(index, e.target.value)}
                              name={`interest-${index}`}
                              placeholder="Enter an interest"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveInterest(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={handleAddInterest}>
                          Add Interest
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Member Type</Label>
                        <Input id="type" name="type" value={formData.type} onChange={handleInputChange} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members available</p>
      ) : (
        <DynamicTable data={members} onDelete={handleDelete} onUpdate={handleUpdate} onReload={loadMembers} />
      )}
    </div>
  )
}