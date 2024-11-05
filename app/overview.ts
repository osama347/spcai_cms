"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from 'next/cache'


export const TotalPublicationsforpast1year = async () => {
const supabase = createClient()
    
    const { data, error } =  await supabase
        .rpc('total_publications_past_year_json')
    
    if (error) {
      return { error: error.message }
    }
  
    return { totalpublications: data || [] }
}

export const recentProjects = async () => {
const supabase = createClient()

    const { data, error } = await supabase.from('projects').select('name').order('id', { ascending: false })
    
    if (error) {
        return { error: error.message }
        
    }
    return {recentProjects: data || []}
}