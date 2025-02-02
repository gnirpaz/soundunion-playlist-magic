import { auth } from "@/app/auth"
import SignIn from "../components/sign-in"
export default async function PrivatePage() {
  const session = await auth()
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <SignIn />
      <h1 className="text-2xl font-bold mb-4">Private Page</h1>
      <div className="bg-purple-900/30 p-4 rounded-lg">
        <p className="mb-2">You are logged in as: {session?.user?.email}</p>
        <pre className="bg-black/50 p-4 rounded overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  )
} 