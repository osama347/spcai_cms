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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { nanoid } from 'nanoid'

const supabase = createClient()

async function fetchAffiliations() {
  const { data, error } = await supabase.from('affiliations').select()
    
  if (error) {
    return { error: error.message }
  }
  
  return { affiliations: data || [] }
}

async function addAffiliation(formData: FormData) {
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const url = formData.get('url') as string

  // Handle image upload
  const imageFile = formData.get('image') as File
  let imageUrl = null

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `affiliations/${nanoid()}.${fileExt}`
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
    .from('affiliations')
    .insert({ name, type, url, image: imageUrl })

  if (error) {
    return { error: error.message }
  }
    
  return { success: true }
}

async function deleteAffiliation(item: Record<string, any>) {
  // Step 1: Fetch the image path of the affiliation
  const { data: affiliationData, error: fetchError } = await supabase
    .from('affiliations')
    .select('image')
    .eq('id', item.id)
    .single()

  if (fetchError) {
    console.error('Error fetching affiliation:', fetchError.message)
    return { error: fetchError.message }
  }

  const imagePath = affiliationData?.image

  if (imagePath) {
    // Extract the file path from the full URL
    const filePathMatch = imagePath.match(/\/storage\/v1\/object\/public\/spcai_images\/(.+)/)
    
    if (filePathMatch && filePathMatch[1]) {
      const filePath = filePathMatch[1]
      
      // Step 2: Delete the image file from the Supabase bucket
      const { error: deleteImageError } = await supabase
        .storage
        .from('spcai_images')
        .remove([filePath])

      if (deleteImageError) {
        console.error('Error deleting image from storage:', deleteImageError.message)
        return { error: deleteImageError.message }
      }
    }
  }

  // Step 3: Delete the affiliation record from the database
  const { error: deleteAffiliationError } = await supabase
    .from('affiliations')
    .delete()
    .eq('id', item.id)

  if (deleteAffiliationError) {
    console.error('Error deleting affiliation:', deleteAffiliationError.message)
    return { error: deleteAffiliationError.message }
  }

  // If everything succeeds
  return { success: true }
}



async function updateAffiliation(params: { column: string; value: any; conditionColumn: string; conditionValue: any }[], item: Record<string, any>) {
  const updateData: Record<string, any> = {}
  params.forEach(param => {
    updateData[param.column] = param.value
  })

  const { error } = await supabase
    .from('affiliations')
    .update(updateData)
    .eq('id', item.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}


export default function Affiliation() {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [affiliations, setAffiliations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAffiliations = async () => {
    setIsLoading(true)
    setError(null)
    const result = await fetchAffiliations()
    if ('error' in result) {
      setError(result.error || null )
    } else {
      setAffiliations(result.affiliations)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadAffiliations()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    try {
      const result = await addAffiliation(formData)
      if ('success' in result) {
        setIsOpen(false)
        toast({
          title: "Success!",
          description: "Affiliation added successfully.",
          variant: "default",
        })
        loadAffiliations() // Refresh the affiliations list
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
      setIsOpen(false)
    }
  }

  const handleDelete = async (item: Record<string, any>): Promise<{ success?: boolean; error?: string }> => {
    try {
      const result = await deleteAffiliation(item)
      if ('success' in result) {
        toast({
          title: "Success!",
          description: "Affiliation deleted successfully.",
          variant: "default",
        })
        loadAffiliations() // Refresh the affiliations list
        return { success: true }
      } else {
        setError(result.error)
        toast({
          title: "Failed!",
          description: result.error + " Please try again.",
          variant: "destructive",
        })
        return { error: result.error }
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
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
      const result = await updateAffiliation(params, item)
      if ('success' in result) {
        toast({
          title: "Success!",
          description: "Afilliation updated successfully.",
          variant: "default",
        })
        loadAffiliations()
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
        <h1 className="text-2xl font-bold">Affiliations</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Add New Affiliation</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Affiliation</DialogTitle>
              <DialogDescription>
                Enter the details of the new affiliation here. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Card>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select affiliation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input id="url" name="url" type="url" placeholder="https://" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Logo Image</Label>
                    <Input id="image" name="image" type="file" accept="image/*" required />
                  </div>
                </CardContent>
              </Card>
              <Button type="submit" className="w-full">Add Affiliation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {affiliations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No affiliations available</p>
      ) : (
        <DynamicTable data={affiliations} onDelete={handleDelete} onReload={loadAffiliations} onUpdate={handleUpdate}/>
      )}
    </div>
  )
}