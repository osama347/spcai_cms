"use client"

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ChevronRight, ChevronDown, Folder, File, Loader2, AlertCircle, Upload, Plus, Trash, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import Image from 'next/image'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface StorageItem {
  id: string
  name: string
  metadata?: {
    mimetype?: string
  }
}

interface TreeNode {
  id: string
  name: string
  isFolder: boolean
  children: TreeNode[]
  path: string
}

const supabase = createClient()

async function fetchFilesAndFolders(path = '') {
  const { data, error } = await supabase.storage
    .from('spcai_images')
    .list(path, { sortBy: { column: 'name', order: 'asc' } })

  if (error) {
    console.error('Error retrieving files and folders:', error)
    return []
  }

  return data || []
}

function buildTreeStructure(items: StorageItem[], parentPath = ''): TreeNode[] {
  const tree: TreeNode[] = []
  const map: { [key: string]: TreeNode } = {}

  items.forEach((item, index) => {
    const parts = item.name.split('/')
    let currentLevel = tree
    let currentPath = parentPath

    parts.forEach((part, partIndex) => {
      currentPath += (currentPath ? '/' : '') + part
      const isFile = partIndex === parts.length - 1 && item.metadata?.mimetype !== undefined
      const id = `${currentPath}`

      let node = map[currentPath]

      if (!node) {
        node = {
          id,
          name: part,
          isFolder: !isFile,
          children: [],
          path: currentPath,
        }
        map[currentPath] = node
        currentLevel.push(node)
      }

      if (!isFile) {
        currentLevel = node.children
      }
    })
  })

  return tree
}

function ConfirmDialog({ onConfirm, children }: { onConfirm: () => void; children: React.ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the file or folder and all its contents.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function TreeNode({ node, level = 0, onSelect, onRefresh, parentId, setCurrentPath }: { node: TreeNode; level?: number; onSelect: (node: TreeNode) => void; onRefresh: () => void; parentId: string; setCurrentPath: (path: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [children, setChildren] = useState<TreeNode[]>(node.children)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(node.name)

  const toggleOpen = async () => {
    if (node.isFolder) {
      setCurrentPath(node.path)
      if (children.length === 0) {
        const items = await fetchFilesAndFolders(node.path)
        const newChildren = buildTreeStructure(items as StorageItem[], node.path)
        setChildren(newChildren)
      }
      setIsOpen(!isOpen)
    }
  }

  const handleClick = () => {
    if (node.isFolder) {
      toggleOpen()
    } else {
      onSelect(node)
    }
  }

  const handleDelete = async () => {
    console.log(`Attempting to delete: ${node.path}`)
    const { data, error } = await supabase.storage
      .from('spcai_images')
      .remove([node.path])

    if (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: `Failed to delete ${node.name}: ${error.message}`,
        variant: "destructive",
      })
    } else {
      console.log('Delete response:', data)
      toast({
        title: "Success",
        description: `${node.name} deleted successfully`,
      })
      onRefresh()
    }
  }

  const handleRename = async () => {
    if (isRenaming) {
      console.log(`Attempting to rename: ${node.path} to ${newName}`)
      const newPath = node.path.split('/').slice(0, -1).concat(newName).join('/')
      const { data, error } = await supabase.storage
        .from('spcai_images')
        .move(node.path, newPath)

      if (error) {
        console.error('Rename error:', error)
        toast({
          title: "Error",
          description: `Failed to rename ${node.name}: ${error.message}`,
          variant: "destructive",
        })
      } else {
        console.log('Rename response:', data)
        toast({
          title: "Success",
          description: `${node.name} renamed to ${newName}`,
        })
        onRefresh()
      }
    }
    setIsRenaming(!isRenaming)
  }

  return (
    <Draggable draggableId={node.id} index={level} key={node.id}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="flex-grow justify-start px-2 py-1 h-auto"
              onClick={handleClick}
            >
              <span style={{ marginLeft: `${level * 20}px` }} className="flex items-center">
                {node.isFolder ? (
                  isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />
                ) : null}
                {node.isFolder ? (
                  <Folder className="h-4 w-4 mr-2" />
                ) : (
                  <File className="h-4 w-4 mr-2" />
                )}
                {isRenaming ? (
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    className="h-6 py-0 px-1"
                  />
                ) : (
                  node.name
                )}
              </span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRename}>
              <Edit className="h-4 w-4" />
            </Button>
            <ConfirmDialog onConfirm={handleDelete}>
              <Button variant="ghost" size="icon">
                <Trash className="h-4 w-4" />
              </Button>
            </ConfirmDialog>
          </div>
          {isOpen && node.isFolder && (
            <Droppable droppableId={node.id}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {children.map((childNode, index) => (
                    <TreeNode key={childNode.id} node={childNode} level={level + 1} onSelect={onSelect} onRefresh={onRefresh} parentId={node.id} setCurrentPath={setCurrentPath} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  )
}

// ... (FileContent component remains unchanged)
function FileContent({ node }: { node: TreeNode }) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase.storage
          .from('spcai_images')
          .download(node.path)
        
        if (error) throw error

        if (node.name.match(/\.(jpg|jpeg|png|gif)$/i)) {
          const url = URL.createObjectURL(data)
          setContent(url)
        } else if (node.name.match(/\.(txt|md|js|ts|html|css)$/i)) {
          const text = await data.text()
          setContent(text)
        } else {
          setError('Unsupported file format')
        }
      } catch (err) {
        setError('Failed to load file content')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [node])

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (node.name.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Image src={content!} alt={node.name} width={400} height={400} objectFit="contain" />
      </div>
    )
  }

  if (node.name.match(/\.(txt|md|js|ts|html|css)$/i)) {
    return (
      <ScrollArea className="h-full w-full">
        <pre className="p-4 whitespace-pre-wrap">{content}</pre>
      </ScrollArea>
    )
  }

  return null
}

function UploadDialog({ currentPath, onUpload }: { currentPath: string; onUpload: () => void }) {
  const [file, setFile] = useState<File | null>(null)

  const handleUpload = async () => {
    if (!file) return

    const { error } = await supabase.storage
      .from('spcai_images')
      .upload(`${currentPath}/${file.name}`, file)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
      onUpload()
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>Upload a file to the current folder: {currentPath}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              File
            </Label>
            <Input
              id="file"
              type="file"
              className="col-span-3"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewFolderDialog({ currentPath, onCreateFolder }: { currentPath: string; onCreateFolder: () => void }) {
  const [folderName, setFolderName] = useState('')

  const handleCreateFolder = async () => {
    if (!folderName) return

    const { error } = await supabase.storage
      .from('spcai_images')
      .upload(`${currentPath}/${folderName}/.keep`, new Blob([]))

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Folder created successfully",
      })
      onCreateFolder()
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>Enter a name for the new folder in: {currentPath}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folderName" className="text-right">
              Folder Name
            </Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateFolder}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Files() {
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [currentPath, setCurrentPath] = useState('')

  const refreshTree = async () => {
    setIsLoading(true)
    const items = await fetchFilesAndFolders()
    const tree = buildTreeStructure(items as StorageItem[])
    setTreeData(tree)
    setIsLoading(false)
  }

  useEffect(() => {
    refreshTree()
  }, [])

  const onDragEnd = async (result: any) => {
    if (!result.destination) return

    const sourceId = result.draggableId
    const destinationId = result.destination.droppableId

    const sourceNode = findNode(treeData, sourceId)
    const destinationNode = findNode(treeData, destinationId)

    if (sourceNode && destinationNode && destinationNode.isFolder) {
      const newPath = `${destinationNode.path}/${sourceNode.name}`
      const { error } = await supabase.storage
        .from('spcai_images')
        .move(sourceNode.path, newPath)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to move item",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Item moved successfully",
        })
        refreshTree()
      }
    }
  }

  const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findNode(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
      <div className="flex justify-between  p-4 border-b">
        <h1 className="text-2xl font-bold">File Explorer</h1>
        <div className="space-x-2">
          <UploadDialog currentPath={currentPath} onUpload={refreshTree} />
          <NewFolderDialog currentPath={currentPath} onCreateFolder={refreshTree} />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="w-1/3 border-r overflow-auto">
            <ScrollArea className="h-full">
              <Droppable droppableId="root">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="p-4">
                    {treeData.map((node, index) => (
                      <TreeNode key={node.id} node={node} onSelect={setSelectedNode} onRefresh={refreshTree} parentId="root" setCurrentPath={setCurrentPath} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </ScrollArea>
          </div>
        </DragDropContext>
        <div className="w-2/3 p-4 overflow-auto">
          {selectedNode && !selectedNode.isFolder ? (
            <FileContent node={selectedNode} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  )
}