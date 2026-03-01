import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const COACH_ORIGIN = process.env.NEXT_PUBLIC_COACH_ORIGIN || '*'

function withCors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', COACH_ORIGIN)
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

interface PlayerRow {
  id: string
  full_name: string
  ic_number: string
  date_of_birth: string
  gender: string
  race: string | null
  belt_rank: string
  weight_kg: number
  height_cm: number
  club_status: string
  club_id: string | null
  created_at: string
}

interface CreatePlayerBody {
  fullName: string
  identityCard: string
  birthday: string
  gender: 'Male' | 'Female'
  race?: string
  beltRank: string
  weight: number
  height: number
  clubName: string
}

function mapPlayerToStudent(row: PlayerRow, clubName: string) {
  const gender =
    row.gender.toLowerCase() === 'female'
      ? 'Female'
      : 'Male'

  const status =
    row.club_status.toLowerCase() === 'approved'
      ? 'active'
      : 'pending'

  return {
    id: row.id,
    fullName: row.full_name,
    identityCard: row.ic_number,
    birthday: row.date_of_birth,
    gender,
    race: row.race ?? '',
    beltRank: row.belt_rank,
    weight: String(row.weight_kg),
    height: String(row.height_cm),
    clubAffiliation: clubName,
    phoneNumber: '',
    registrationDate: row.created_at.split('T')[0],
    status,
  }
}

export async function OPTIONS() {
  const response = NextResponse.json(null, { status: 204 })
  return withCors(response)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const clubName = url.searchParams.get('clubName') || ''

    const supabase = await createClient()

    let clubId: string | null = null

    if (clubName) {
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .select('id')
        .eq('name', clubName)
        .eq('is_active', true)
        .maybeSingle()

      if (clubError) {
        const response = NextResponse.json(
          { error: clubError.message },
          { status: 400 }
        )
        return withCors(response)
      }

      clubId = club?.id ?? null
    }

    let query = supabase
      .from('fighters')
      .select(
        'id, full_name, ic_number, date_of_birth, gender, race, belt_rank, weight_kg, height_cm, club_status, club_id, created_at'
      )
      .order('created_at', { ascending: false })

    if (clubId) {
      query = query.eq('club_id', clubId)
    }

    const { data, error } = await query

    if (error) {
      const response = NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
      return withCors(response)
    }

    const safeClubName = clubName || ''
    const students = (data ?? []).map((row) =>
      mapPlayerToStudent(row as PlayerRow, safeClubName)
    )

    const response = NextResponse.json(students)
    return withCors(response)
  } catch (error) {
    const response = NextResponse.json(
      { error: 'Failed to load players' },
      { status: 500 }
    )
    return withCors(response)
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePlayerBody

    if (!body.fullName || !body.identityCard || !body.birthday) {
      const response = NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
      return withCors(response)
    }

    if (!body.clubName) {
      const response = NextResponse.json(
        { error: 'clubName is required' },
        { status: 400 }
      )
      return withCors(response)
    }

    const supabase = await createClient()

    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('name', body.clubName)
      .eq('is_active', true)
      .maybeSingle()

    if (clubError || !club) {
      const response = NextResponse.json(
        { error: 'Club not found or inactive' },
        { status: 400 }
      )
      return withCors(response)
    }

    const gender =
      body.gender === 'Female'
        ? 'female'
        : 'male'

    const { data, error } = await supabase
      .from('fighters')
      .insert({
        full_name: body.fullName,
        ic_number: body.identityCard,
        date_of_birth: body.birthday,
        gender,
        race: body.race ?? null,
        belt_rank: body.beltRank,
        weight_kg: body.weight,
        height_cm: body.height,
        club_id: club.id,
      })
      .select(
        'id, full_name, ic_number, date_of_birth, gender, race, belt_rank, weight_kg, height_cm, club_status, club_id, created_at'
      )
      .maybeSingle()

    if (error || !data) {
      const response = NextResponse.json(
        { error: error?.message || 'Failed to create player' },
        { status: 400 }
      )
      return withCors(response)
    }

    const student = mapPlayerToStudent(data as PlayerRow, body.clubName)
    const response = NextResponse.json(student, { status: 201 })
    return withCors(response)
  } catch (error) {
    const response = NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    )
    return withCors(response)
  }
}
