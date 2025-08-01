/**
 * Generates avatar fallback text and background color based on user's name
 * @param name - User's full name
 * @param email - User's email (fallback if name is not available)
 * @returns Object with initials and background color
 */
export function getAvatarFallback(name?: string | null, email?: string | null) {
  // Use name if available, otherwise use email
  const displayName = name || email || "User"
  
  // Generate initials
  let initials = ""
  if (displayName.includes("@")) {
    // If it's an email, use first letter of the part before @
    initials = displayName.split("@")[0].charAt(0).toUpperCase()
  } else {
    // If it's a name, use first letter of each word (max 2)
    const words = displayName.trim().split(/\s+/)
    if (words.length === 1) {
      initials = words[0].charAt(0).toUpperCase()
    } else {
      initials = words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join("")
    }
  }
  
  // Generate consistent background color based on the first character
  const colors = [
    "bg-red-500",
    "bg-orange-500", 
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-slate-500",
    "bg-gray-500",
    "bg-zinc-500"
  ]
  
  // Use first character's char code to determine color
  const firstChar = initials.charAt(0) || "U"
  const colorIndex = firstChar.charCodeAt(0) % colors.length
  const backgroundColor = colors[colorIndex]
  
  return {
    initials,
    backgroundColor,
    className: `${backgroundColor} text-white`
  }
}
