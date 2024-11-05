'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

const supabase = createClient()

export default function ImageUploader() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsUploading(true)

    const form = event.target as HTMLFormElement
    const fileInput = form.elements.namedItem('image') as HTMLInputElement
    const file = fileInput.files?.[0]

    if (!file) {
      toast({
        title: "Error",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      setIsUploading(false)
      return
    }

    try {
      const { data, error } = await supabase.storage
        .from('spcai_images')
        .upload(`public/${Date.now()}_${file.name}`, file)

      if (error) throw error

      if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('spcai_images')
          .getPublicUrl(data.path)

        if (publicUrlData?.publicUrl) {
          setImageUrl(publicUrlData.publicUrl)
          toast({
            title: "Success",
            description: "Image uploaded successfully",
          })
        }
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast({
        title: "Error",
        description: "An error occurred while uploading the image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!imageUrl) return

    setIsDeleting(true)

    try {
      // Extract the file path from the full URL
      const filePathMatch = imageUrl.match(/\/storage\/v1\/object\/public\/spcai_images\/(.+)/)
      
      if (filePathMatch && filePathMatch[1]) {
        const filePath = filePathMatch[1]
        
        const { error } = await supabase.storage
          .from('spcai_images')
          .remove([filePath])

        if (error) throw error

        setImageUrl(null)
        setSelectedImage(null)
        toast({
          title: "Success",
          description: "Image deleted successfully",
        })
      } else {
        throw new Error("Invalid file path")
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast({
        title: "Error",
        description: "An error occurred while deleting the image",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <Link href="/dashboard" className="text-blue-500 hover:underline">Go to dashboard</Link>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Upload an Image</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="file"
            name="image"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setSelectedImage(URL.createObjectURL(file))
              }
            }}
            required
          />
          <Button 
            type="submit" 
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </form>

        {selectedImage && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Preview:</h2>
            <img src={selectedImage} alt="Selected preview" className="object-cover max-w-[200px] max-h-[200px]" />
          </div>
        )}

        {imageUrl && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Uploaded Image:</h2>
            <img 
              src={imageUrl} 
              alt="Uploaded image" 
              className="object-cover border-2 border-black max-w-[500px] max-h-[500px]"
            />
            <p className="text-sm text-gray-500 break-all">{imageUrl}</p>
            <Button 
              onClick={handleDelete} 
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? 'Deleting...' : 'Delete Image'}
            </Button>
          </div>
        )}
      </div> 
    </div>
  )
}