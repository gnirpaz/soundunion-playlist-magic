
import { signIn } from "@/app/auth"
import { Button } from "@/components/ui/button"
 
export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("spotify")
      }}
    >
      <Button variant="secondary"  type="submit">Signin with Spotify</Button>
    </form>
  )
} 