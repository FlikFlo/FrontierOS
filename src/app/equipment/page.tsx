import { createClient } from '@/lib/supabase/server'
import { mockEquipment } from '@/lib/mock-data'
import type { Equipment } from '@/types/database'
import EquipmentView from './EquipmentView'

export default async function EquipmentPage() {
  const supabase = await createClient()
  let items: Equipment[] = mockEquipment
  let isMock = true

  if (supabase) {
    const { data } = await supabase.from('equipment').select('*').order('name')
    if (data && data.length) {
      items = data as Equipment[]
      isMock = false
    }
  }

  return <EquipmentView items={items} isMock={isMock} />
}
