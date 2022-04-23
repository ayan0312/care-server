import { Entity } from 'typeorm'
import { StarNameEntity } from 'src/shared/name/starName.entity'

@Entity('character_group')
export class CharacterGroupEntity extends StarNameEntity {}
