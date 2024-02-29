import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User, { type UserId } from '#auth/models/user'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import Reservation, { type ReservationId } from '#reservations/models/reservation'
import { Opaque } from '@adonisjs/core/types/helpers'

export enum CartonSize {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
}

export enum CartonStatus {
  INSTOCK = 'INSTOCK',
  RESERVED = 'RESERVED',
  DELIVERED = 'DELIVERED',
  NOTAVAILABLE = 'NOTAVAILABLE',
}
export type CartonId = Opaque<'CartonId', number>

export default class Carton extends BaseModel {
  @column({ isPrimary: true })
  declare id: CartonId

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare size: CartonSize

  @column()
  declare status: CartonStatus

  @column()
  declare merchantId: UserId

  @column()
  declare reservationId: ReservationId | null

  @belongsTo(() => User, { foreignKey: 'merchantId' })
  declare merchant: BelongsTo<typeof User>

  @belongsTo(() => Reservation, { foreignKey: 'reservationId' })
  declare reservation: BelongsTo<typeof Reservation>
}
