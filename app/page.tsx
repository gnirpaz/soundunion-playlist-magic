"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"


export default function Home() {

      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
          Create Your Perfect Playlist
        </h1>
        <Link href="/new">
          <Button className="bg-gradient-to-r from-purple-500 to-fuchsia-500">
            Get Started
          </Button>
        </Link>
      </div>


}

