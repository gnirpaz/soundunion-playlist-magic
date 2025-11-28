export { auth as proxy } from "@/app/auth"

export const config = {
  matcher: [
    '/private',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

