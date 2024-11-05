"use client"

import React, { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, Check, X, Pencil, Trash, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UpdateParams {
  column: string;
  value: any;
  conditionColumn: string;
  conditionValue: any;
}

interface TableProps {
  data: Record<string, any>[];
  className?: string;
  itemsPerPage?: number;
  onDelete?: (item: Record<string, any>) => Promise<{ success?: boolean; error?: string }>;
  onUpdate?: (params: UpdateParams[], item: Record<string, any>) => Promise<any>;
  onReload?: () => Promise<void>;
}

const ExpandableCell: React.FC<{ content: string }> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 40;

  if (content.length <= maxLength) {
    return <span>{content}</span>;
  }

  return (
    <div>
      {isExpanded ? content : `${content.slice(0, maxLength)}...`}
      <Button
        variant="ghost"
        size="sm"
        className="ml-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
    </div>
  );
};

const CellContent: React.FC<{ header: string; value: any }> = ({ header, value }) => {
  if (header === 'tags' && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((tag, index) => (
          <Badge key={index} variant="secondary">{tag}</Badge>
        ))}
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div>
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
          {value.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (typeof value === 'boolean' && header.startsWith('is_')) {
    return value ? <Check className="text-green-500" /> : <X className="text-red-500" />;
  }

  if (typeof value === 'string' && value.startsWith('http')) {
    return <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{value}</a>;
  }

  return <ExpandableCell content={value?.toString() || ''} />;
};

export default function EnhancedDynamicTable({ 
  data, 
  className = '', 
  itemsPerPage = 6,
  onDelete,
  onUpdate,
  onReload
}: TableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [editedData, setEditedData] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [updatedFields, setUpdatedFields] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Record<string, any> | null>(null)

  if (!data || data.length === 0) {
    return <p className="text-muted-foreground">No data available</p>
  }
  const { toast } = useToast()
  const headers = Object.keys(data[0]).filter(header => header !== 'id')
  const imageField = headers.find(header => header.toLowerCase().includes('image'))

  const filteredData = useMemo(() => {
    return data.filter(item =>
      Object.entries(item).some(([key, value]) =>
        key !== 'id' && value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const handleDelete = async (item: Record<string, any>) => {
    setItemToDelete(item)
    setIsDeleteDialogOpen(true)
  };

  const confirmDelete = async () => {
    if (onDelete && itemToDelete) {
      const { success, error } = await onDelete(itemToDelete);
      
      if (success && onReload) {
        toast({
          title: "Success!",
          description: "Item deleted successfully.",
          variant: "default",
        });
        await onReload();
      } else if (error) {
        toast({
          title: "Error!",
          description: `Failed to delete item: ${error}`,
          variant: "destructive",
        });
        console.error("Error deleting item:", error);
      }
    } else {
      console.warn('onDelete function is not defined');
    }
    setIsDeleteDialogOpen(false)
    setItemToDelete(null)
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  const handleEdit = (item: Record<string, any>) => {
    setEditingId(item.id)
    setEditedData(item)
    setUpdatedFields([])
  }

  const handleSave = async () => {
    if (onUpdate && editingId !== null) {
      const updateParams: UpdateParams[] = updatedFields.map(field => ({
        column: field,
        value: editedData[field],
        conditionColumn: 'id',
        conditionValue: editingId
      }))
      
      await onUpdate(updateParams, editedData)
      
      if (onReload) {
        await onReload()
      }
    }
    setEditingId(null)
    setEditedData({})
    setUpdatedFields([])
  }

  const handleInputChange = (header: string, value: string) => {
    setEditedData(prev => ({ ...prev, [header]: value }))
    if (!updatedFields.includes(header)) {
      setUpdatedFields(prev => [...prev, header])
    }
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setCurrentPage(1)
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {imageField && <TableHead>Image</TableHead>}
            {headers.filter(header => header !== imageField).map((header) => (
              <TableHead key={header} className="capitalize">
                {header.replace(/([A-Z])/g, ' $1').trim()}
              </TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((row) => (
            <TableRow key={row.id}>
              {imageField && (
                <TableCell>
                  <Avatar>
                    <AvatarImage src={row[imageField]} alt="Avatar" />
                    <AvatarFallback>{row[imageField]?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                </TableCell>
              )}
              {headers.filter(header => header !== imageField).map((header) => (
                <TableCell key={`${row.id}-${header}`}>
                  {editingId === row.id ? (
                    <Input
                      value={editedData[header] || ''}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                    />
                  ) : (
                    <CellContent header={header} value={row[header]} />
                  )}
                </TableCell>
              ))}
              <TableCell>
                {editingId === row.id ? (
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={handleSave}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}