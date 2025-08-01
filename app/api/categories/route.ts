import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedCategories = categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      color: category.color,
      questionCount: category._count.questions
    }))

    return NextResponse.json({
      categories: formattedCategories,
      success: true
    })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, icon, color } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', success: false },
        { status: 400 }
      )
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        color: color || '#3b82f6'
      }
    })

    return NextResponse.json({
      category,
      success: true
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category', success: false },
      { status: 500 }
    )
  }
}
