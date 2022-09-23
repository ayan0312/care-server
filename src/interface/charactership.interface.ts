export type ICharactership = (
    | {
          selfId: number
          targetId: number
      }
    | {
          selfId: number
          targetName: string
      }
    | {
          selfName: string
          targetId: number
      }
) & {
    relationshipId: number
}

export type ICharactershipResult = ICharactership
