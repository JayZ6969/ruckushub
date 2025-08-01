// Centralized level system utilities
export interface LevelInfo {
  level: string
  next: string
  pointsToNext: number
  levelNumber: number // For compatibility with existing numeric references
}

export function getUserLevel(points: number, reputation: number): LevelInfo {
  const totalScore = points + reputation
  
  if (totalScore >= 5000) {
    return { 
      level: "Legend", 
      next: "Legend", 
      pointsToNext: 0, 
      levelNumber: 6 
    }
  }
  if (totalScore >= 2000) {
    return { 
      level: "Master Contributor", 
      next: "Legend", 
      pointsToNext: 5000 - totalScore, 
      levelNumber: 5 
    }
  }
  if (totalScore >= 1000) {
    return { 
      level: "Expert Helper", 
      next: "Master Contributor", 
      pointsToNext: 2000 - totalScore, 
      levelNumber: 4 
    }
  }
  if (totalScore >= 500) {
    return { 
      level: "Advanced Helper", 
      next: "Expert Helper", 
      pointsToNext: 1000 - totalScore, 
      levelNumber: 3 
    }
  }
  if (totalScore >= 100) {
    return { 
      level: "Helper", 
      next: "Advanced Helper", 
      pointsToNext: 500 - totalScore, 
      levelNumber: 2 
    }
  }
  
  return { 
    level: "Beginner", 
    next: "Helper", 
    pointsToNext: 100 - totalScore, 
    levelNumber: 1 
  }
}

export function getLevelFromNumber(levelNumber: number): string {
  switch (levelNumber) {
    case 6: return "Legend"
    case 5: return "Master Contributor"
    case 4: return "Expert Helper"
    case 3: return "Advanced Helper"
    case 2: return "Helper"
    case 1:
    default: return "Beginner"
  }
}

export function getNumberFromLevel(levelName: string): number {
  switch (levelName) {
    case "Legend": return 6
    case "Master Contributor": return 5
    case "Expert Helper": return 4
    case "Advanced Helper": return 3
    case "Helper": return 2
    case "Beginner":
    default: return 1
  }
}
