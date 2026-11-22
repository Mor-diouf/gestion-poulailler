import {
  Bird,
  Droplets,
  Flame,
  HandCoins,
  Package,
  Pill,
  Scissors,
  Skull,
  Truck,
  Users,
  Wheat,
  Wrench,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import type { Teinte } from '@/components/ui'
import type { TypeOperation } from './calculs'
import type { Categorie } from './types'

export const ICONE_CATEGORIE: Record<Categorie, LucideIcon> = {
  Aliment: Wheat,
  'Médicaments et vaccins': Pill,
  Matériel: Wrench,
  Déplumage: Scissors,
  Transport: Truck,
  Litière: Layers,
  'Énergie et eau': Droplets,
  "Main-d'œuvre": Users,
  Autre: Package,
}

export const ICONE_OPERATION: Record<TypeOperation, { icone: LucideIcon; teinte: Teinte }> = {
  bande: { icone: Bird, teinte: 'vert' },
  mortalite: { icone: Skull, teinte: 'rouge' },
  charge: { icone: Flame, teinte: 'ambre' },
  vente: { icone: HandCoins, teinte: 'vert' },
}
