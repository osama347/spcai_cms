'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

const supabase = createClient()

async function fetchFaculty() {
  const { data, error } = await supabase.from('faculty').select()
    
  if (error) {
    return { error: error.message }
  }
  
  return { faculty: data || [] }
}
  
async function addFaculty(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const bio = formData.get('bio') as string
  const scholar = formData.get('scholar') as string
  const website = formData.get('website') as string
  const linkedin = formData.get('linkedin') as string
  const twitter = formData.get('twitter') as string

  // Handle image upload
  const imageFile = formData.get('image') as File
  let imageUrl = null

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `faculty/${nanoid()}.${fileExt}`
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
    .from('faculty')
    .insert({ 
      name, 
      email, 
      bio, 
      image: imageUrl,
      scholar,
      website,
      linkedin,
      twitter
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

async function DeleteFaculty(item: Record<string, any>) {
  // Step 1: Fetch the image path of the faculty first
  const { data: facultyData, error: fetchError } = await supabase
    .from('faculty')
    .select('image')
    .eq('id', item.id)
    .single();

  if (fetchError) {
    console.error('Error fetching faculty:', fetchError.message);
    return { error: fetchError.message };
  }

  const imagePath = facultyData?.image;

  if (imagePath) {
    // Extract the file path from the full URL
    const filePathMatch = imagePath.match(/\/storage\/v1\/object\/public\/spcai_images\/(.+)/);
    
    if (filePathMatch && filePathMatch[1]) {
      const filePath = filePathMatch[1];
      
      // Step 2: Delete the image file from the Supabase bucket
      const { error: deleteImageError } = await supabase
        .storage
        .from('spcai_images')
        .remove([filePath]);

      if (deleteImageError) {
        console.error('Error deleting image from storage:', deleteImageError.message);
        return { error: deleteImageError.message };
      }
    }
  }

  // Step 3: Delete the faculty record from the database
  const { error: deleteFacultyError } = await supabase
    .from('faculty')
    .delete()
    .eq('id', item.id);

  if (deleteFacultyError) {
    console.error('Error deleting faculty:', deleteFacultyError.message);
    return { error: deleteFacultyError.message };
  }

  // If everything succeeds
  return { success: true };
}

async function updateFaculty(params: { column: string; value: any; conditionColumn: string; conditionValue: any }[], item: Record<string, any>) {
  const updateData: Record<string, any> = {}
  params.forEach(param => {
    updateData[param.column] = param.value
  })

  const { error } = await supabase
    .from('faculty')
    .update(updateData)
    .eq('id', item.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export default function Faculty() {
  const { toast } = useToast()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [faculty, setFaculty] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    image: null as File | null,
    scholar: '',
    website: '',
    linkedin: '',
    twitter: ''
  })

  const loadFaculty = async () => {
    setIsLoading(true)
    setError(null)
    const result = await fetchFaculty()
    if ('error' in result) {
      setError(result.error || null)
    } else {
      setFaculty(result.faculty)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadFaculty()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? (e.target as HTMLInputElement).files?.[0] || null : value
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formDataToSubmit = new FormData()

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        formDataToSubmit.append(key, value)
      }
    })

    try {
      const result = await addFaculty(formDataToSubmit)
      if ('success' in result) {
        setIsOpen(false)
        toast({
          title: "Success!",
          description: "Faculty member added successfully.",
          variant: "default",
        })
        loadFaculty()
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

  const handleDelete = async (item: Record<string, any>): Promise<{ success?: boolean; error?: string }> => {
    try {
      const result = await DeleteFaculty(item)
      if ('success' in result) {
        toast({
          title: "Success!",
          description: "Faculty member deleted successfully.",
          variant: "default",
        })
        loadFaculty()
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
      const result = await updateFaculty(params, item)
      if ('success' in result) {
        toast({
          title: "Success!",
          description: "Faculty member updated successfully.",
          variant: "default",
        })
        loadFaculty()
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
    return <div className="text-center py-10 text-red-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Faculty</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Add New Faculty</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Faculty</DialogTitle>
              <DialogDescription>
                Enter the details of the new faculty member here. Navigate through the tabs to fill out all information.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="social">Social Links</TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <TabsContent value="basic">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} required className="min-h-[100px]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image">Profile Image</Label>
                        <Input id="image" name="image" type="file" accept="image/*" onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="social">
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="scholar">Google Scholar Link</Label>
                        <Input id="scholar" name="scholar" type="url" placeholder="https://scholar.google.com/..." value={formData.scholar} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Personal Website</Label>
                        <Input id="website" name="website" type="url" placeholder="https://..." value={formData.website} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn Profile</Label>
                        <Input id="linkedin" name="linkedin" type="url" placeholder="https://www.linkedin.com/in/..." value={formData.linkedin} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter Profile</Label>
                        <Input id="twitter" name="twitter" type="url" placeholder="https://twitter.com/..." value={formData.twitter} onChange={handleInputChange} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Faculty"}
                </Button>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      {faculty.length === 0 ? (
        <p className="text-sm text-muted-foreground">No faculty members available</p>
      ) : (
        <DynamicTable data={faculty} onDelete={handleDelete} onUpdate={handleUpdate} onReload={loadFaculty} />
      )}
    </div>
  )
}