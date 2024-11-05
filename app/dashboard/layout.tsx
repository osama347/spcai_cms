import React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const Affiliations = dynamic(() => import('./affiliations/page'),{ ssr: false });
const Publications = dynamic(() => import('./publications/page'),{ ssr: false });
const Projects = dynamic(() => import('./projects/page'),{ ssr: false });
const Members = dynamic(() => import('./members/page'),{ ssr: false });
const Faculty = dynamic(() => import('./faculty/page'), { ssr: false });
const Files = dynamic(() => import('./files/page'),{ ssr: false });



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="w-full max-w-6xl px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight overflow-hidden border-r-2 border-black whitespace-nowrap w-0 animate-typing ">
  Welcome to SPCAI content management system
</h2>

            
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="affiliations">Affiliations</TabsTrigger>
              <TabsTrigger value="faculty">Faculty</TabsTrigger>
              <TabsTrigger value="publications">Publications</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <div className="w-[1200px] min-h-[400px] ">
              <TabsContent value="overview" className="">
                {children}
              </TabsContent>
              <TabsContent value="affiliations">
                <Affiliations />
              </TabsContent>
              <TabsContent value="faculty">
                <Faculty />
              </TabsContent>
              <TabsContent value="publications">
                <Publications />
              </TabsContent>
              <TabsContent value="projects">
                <Projects />
              </TabsContent>
              <TabsContent value="members">
                <Members />
              </TabsContent>
              <TabsContent value="files">
                <Files />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}