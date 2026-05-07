import { createClient } from '@/lib/supabase/server'
import { mockEquipment } from '@/lib/mock-data'
import type { Equipment } from '@/types/database'
import FloorPlanCanvas from './FloorPlanCanvas'

export default async function FloorPlanPage() {
  const supabase = await createClient()
  let items: Equipment[] = mockEquipment
  let isMock = true

  if (supabase) {
    const { data } = await supabase.from('equipment').select('*')
    if (data && data.length) {
      items = data as Equipment[]
      isMock = false
    }
  }

  return <FloorPlanCanvas items={items} isMock={isMock} />
}
